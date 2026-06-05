using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace SynonymsApp.Repositories
{
    public class InMemorySynonymRepository : ISynonymRepository
    {
        private readonly IHttpContextAccessor? _httpContextAccessor;

        // Nested dictionary structure: UserId -> Word -> Set of Synonyms
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, ConcurrentDictionary<string, byte>>> _userAdjacencyLists = new(StringComparer.OrdinalIgnoreCase);

        // Security rate limiter/limit to prevent memory/storage exhaustion through open seeding/adding APIs.
        private const int MaxUniqueWordsLimit = 5000;

        public InMemorySynonymRepository(IHttpContextAccessor? httpContextAccessor = null)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private string GetCurrentUserId()
        {
            var httpContext = _httpContextAccessor?.HttpContext;
            if (httpContext != null && httpContext.Request.Headers.TryGetValue("X-User-Id", out var userIdValues))
            {
                var userId = userIdValues.ToString();
                if (!string.IsNullOrWhiteSpace(userId))
                {
                    return userId;
                }
            }
            return "default";
        }

        private ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> GetOrCreateUserAdjacencyList(string userId)
        {
            return _userAdjacencyLists.GetOrAdd(userId, id =>
            {
                var newUserDict = new ConcurrentDictionary<string, ConcurrentDictionary<string, byte>>(StringComparer.OrdinalIgnoreCase);

                // If it is a new user (not "default"), pre-seed it by copying the "default" user's data (if it exists)
                if (!id.Equals("default", StringComparison.OrdinalIgnoreCase) && _userAdjacencyLists.TryGetValue("default", out var defaultDict))
                {
                    foreach (var kvp in defaultDict)
                    {
                        var wordSet = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
                        foreach (var synonym in kvp.Value.Keys)
                        {
                            wordSet.TryAdd(synonym, 0);
                        }
                        newUserDict.TryAdd(kvp.Key, wordSet);
                    }
                }
                return newUserDict;
            });
        }

        public Task AddPairAsync(string word1, string word2)
        {
            if (string.IsNullOrWhiteSpace(word1) || string.IsNullOrWhiteSpace(word2))
            {
                return Task.CompletedTask;
            }

            var w1 = word1.Trim().ToLowerInvariant();
            var w2 = word2.Trim().ToLowerInvariant();

            // Self-synonyms are redundant
            if (w1 == w2)
            {
                return Task.CompletedTask;
            }

            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);

            // Check if adding this pair would exceed the limit of 5000 unique words.
            int newWordsCount = 0;
            if (!userList.ContainsKey(w1)) newWordsCount++;
            if (!userList.ContainsKey(w2)) newWordsCount++;

            if (userList.Count + newWordsCount > MaxUniqueWordsLimit)
            {
                throw new InvalidOperationException($"Cannot add synonym pair. The database is limited to a maximum of {MaxUniqueWordsLimit} words for security reasons.");
            }

            // Add w2 to w1's set
            userList.AddOrUpdate(
                w1,
                _ =>
                {
                    var set = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
                    set.TryAdd(w2, 0);
                    return set;
                },
                (_, set) =>
                {
                    set.TryAdd(w2, 0);
                    return set;
                }
            );

            // Add w1 to w2's set (bi-directional relationship)
            userList.AddOrUpdate(
                w2,
                _ =>
                {
                    var set = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
                    set.TryAdd(w1, 0);
                    return set;
                },
                (_, set) =>
                {
                    set.TryAdd(w1, 0);
                    return set;
                }
            );

            return Task.CompletedTask;
        }

        public Task<IEnumerable<string>> GetDirectSynonymsAsync(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return Task.FromResult<IEnumerable<string>>(Array.Empty<string>());
            }

            var w = word.Trim().ToLowerInvariant();
            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);

            if (userList.TryGetValue(w, out var synonyms))
            {
                return Task.FromResult<IEnumerable<string>>(synonyms.Keys.ToList());
            }

            return Task.FromResult<IEnumerable<string>>(Array.Empty<string>());
        }

        public Task<IEnumerable<KeyValuePair<string, string>>> GetAllPairsAsync()
        {
            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);
            var pairs = new List<KeyValuePair<string, string>>();

            foreach (var kvp in userList)
            {
                var source = kvp.Key;
                foreach (var target in kvp.Value.Keys)
                {
                    // To prevent duplicating links (A-B and B-A) in graph representation,
                    // we output each pair only once based on alphabetical order.
                    if (string.Compare(source, target, StringComparison.OrdinalIgnoreCase) < 0)
                    {
                        pairs.Add(new KeyValuePair<string, string>(source, target));
                    }
                }
            }

            return Task.FromResult<IEnumerable<KeyValuePair<string, string>>>(pairs);
        }

        public Task<IEnumerable<string>> GetAllWordsAsync()
        {
            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);
            return Task.FromResult<IEnumerable<string>>(userList.Keys.ToList());
        }
    }
}
