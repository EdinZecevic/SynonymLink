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

        public Task DeleteWordsAsync(IEnumerable<string> words)
        {
            var wordsToDelete = new HashSet<string>(words, StringComparer.OrdinalIgnoreCase);
            if (wordsToDelete.Count == 0)
            {
                return Task.CompletedTask;
            }

            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);

            foreach (var word in wordsToDelete)
            {
                // Remove this word from other words' synonym lists
                if (userList.TryGetValue(word, out var synonyms))
                {
                    foreach (var synonym in synonyms.Keys)
                    {
                        if (userList.TryGetValue(synonym, out var neighborSynonyms))
                        {
                            neighborSynonyms.TryRemove(word, out _);
                        }
                    }
                }
                
                // Remove the word itself
                userList.TryRemove(word, out _);
            }

            return Task.CompletedTask;
        }

        public Task RenameWordAsync(string oldWord, string newWord)
        {
            if (string.IsNullOrWhiteSpace(oldWord) || string.IsNullOrWhiteSpace(newWord))
            {
                throw new ArgumentException("Both old word and new word must be provided.");
            }

            var oldW = oldWord.Trim().ToLowerInvariant();
            var newW = newWord.Trim().ToLowerInvariant();

            if (oldW == newW)
            {
                return Task.CompletedTask;
            }

            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);

            if (!userList.TryGetValue(oldW, out var oldSynonyms))
            {
                throw new KeyNotFoundException($"Word '{oldWord}' does not exist.");
            }

            // Step 1: Update all words that have oldW as a synonym
            foreach (var synonym in oldSynonyms.Keys)
            {
                if (synonym.Equals(newW, StringComparison.OrdinalIgnoreCase))
                {
                    // Skip self-referencing updates
                    continue;
                }

                if (userList.TryGetValue(synonym, out var neighborSynonyms))
                {
                    neighborSynonyms.TryRemove(oldW, out _);
                    neighborSynonyms.TryAdd(newW, 0);
                }
            }

            // Step 2: Add or merge synonyms into newW's list
            userList.AddOrUpdate(
                newW,
                k =>
                {
                    var set = new ConcurrentDictionary<string, byte>(StringComparer.OrdinalIgnoreCase);
                    foreach (var synonym in oldSynonyms.Keys)
                    {
                        if (!synonym.Equals(newW, StringComparison.OrdinalIgnoreCase))
                        {
                            set.TryAdd(synonym, 0);
                        }
                    }
                    return set;
                },
                (k, existingSet) =>
                {
                    foreach (var synonym in oldSynonyms.Keys)
                    {
                        if (!synonym.Equals(newW, StringComparison.OrdinalIgnoreCase))
                        {
                            existingSet.TryAdd(synonym, 0);
                        }
                    }
                    existingSet.TryRemove(oldW, out _);
                    return existingSet;
                }
            );

            // Step 3: Remove oldW from adjacency list
            userList.TryRemove(oldW, out _);

            return Task.CompletedTask;
        }

        public Task DeleteRelationshipAsync(string word1, string word2)
        {
            if (string.IsNullOrWhiteSpace(word1) || string.IsNullOrWhiteSpace(word2))
            {
                return Task.CompletedTask;
            }

            var w1 = word1.Trim().ToLowerInvariant();
            var w2 = word2.Trim().ToLowerInvariant();

            var userId = GetCurrentUserId();
            var userList = GetOrCreateUserAdjacencyList(userId);

            if (userList.TryGetValue(w1, out var w1Synonyms))
            {
                w1Synonyms.TryRemove(w2, out _);
                if (w1Synonyms.IsEmpty)
                {
                    userList.TryRemove(w1, out _);
                }
            }

            if (userList.TryGetValue(w2, out var w2Synonyms))
            {
                w2Synonyms.TryRemove(w1, out _);
                if (w2Synonyms.IsEmpty)
                {
                    userList.TryRemove(w2, out _);
                }
            }

            return Task.CompletedTask;
        }
    }
}
