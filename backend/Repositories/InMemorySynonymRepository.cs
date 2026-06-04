using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SynonymsApp.Repositories
{
    public class InMemorySynonymRepository : ISynonymRepository
    {
        // Thread-safe dictionary representation of the adjacency list
        // Using ConcurrentDictionary<string, byte> as a thread-safe hash set for values
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _adjacencyList = new(StringComparer.OrdinalIgnoreCase);

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

            // Add w2 to w1's set
            _adjacencyList.AddOrUpdate(
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
            _adjacencyList.AddOrUpdate(
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

            if (_adjacencyList.TryGetValue(w, out var synonyms))
            {
                return Task.FromResult<IEnumerable<string>>(synonyms.Keys.ToList());
            }

            return Task.FromResult<IEnumerable<string>>(Array.Empty<string>());
        }

        public Task<IEnumerable<KeyValuePair<string, string>>> GetAllPairsAsync()
        {
            var pairs = new List<KeyValuePair<string, string>>();

            foreach (var kvp in _adjacencyList)
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
            return Task.FromResult<IEnumerable<string>>(_adjacencyList.Keys.ToList());
        }
    }
}
