using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using SynonymsApp.Models;
using SynonymsApp.Repositories;

namespace SynonymsApp.Services
{
    public class SynonymService : ISynonymService
    {
        private readonly ISynonymRepository _repository;
        private readonly HttpClient _httpClient;

        // Base words list with high synonym density to guarantee >= 1000 words after seeding
        private static readonly string[] SeedBaseWords = new[]
        {
            "clean", "fast", "happy", "smart", "big", "small", "hot", "cold", "hard", "soft",
            "loud", "quiet", "new", "old", "right", "wrong", "heavy", "light", "strong", "weak",
            "easy", "difficult", "safe", "dangerous", "rich", "poor", "sweet", "sour", "beautiful", "ugly",
            "good", "bad", "angry", "brave", "calm", "clever", "eager", "gentle", "polite", "rude"
        };

        public SynonymService(ISynonymRepository repository, HttpClient httpClient)
        {
            _repository = repository;
            _httpClient = httpClient;
        }

        public async Task AddSynonymPairAsync(string word1, string word2)
        {
            await _repository.AddPairAsync(word1, word2);
        }

        public async Task<IEnumerable<string>> GetTransitiveSynonymsAsync(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return Array.Empty<string>();
            }

            var startWord = word.Trim().ToLowerInvariant();
            var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var queue = new Queue<string>();

            visited.Add(startWord);
            queue.Enqueue(startWord);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                var neighbors = await _repository.GetDirectSynonymsAsync(current);
                foreach (var neighbor in neighbors)
                {
                    if (!visited.Contains(neighbor))
                    {
                        visited.Add(neighbor);
                        queue.Enqueue(neighbor);
                    }
                }
            }

            // Exclude the starting word from the result
            visited.Remove(startWord);
            return visited;
        }

        public async Task<GraphResponse> GetSynonymGraphAsync()
        {
            var words = await _repository.GetAllWordsAsync();
            var visited = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var nodes = new List<GraphNode>();
            var groupId = 1;

            foreach (var word in words)
            {
                if (!visited.Contains(word))
                {
                    // Find all transitively connected words (connected component)
                    var componentQueue = new Queue<string>();
                    componentQueue.Enqueue(word);
                    visited.Add(word);

                    while (componentQueue.Count > 0)
                    {
                        var current = componentQueue.Dequeue();
                        nodes.Add(new GraphNode { Id = current, Group = groupId });

                        var neighbors = await _repository.GetDirectSynonymsAsync(current);
                        foreach (var neighbor in neighbors)
                        {
                            if (!visited.Contains(neighbor))
                            {
                                visited.Add(neighbor);
                                componentQueue.Enqueue(neighbor);
                            }
                        }
                    }
                    groupId++;
                }
            }

            var pairs = await _repository.GetAllPairsAsync();
            var links = pairs.Select(p => new GraphLink { Source = p.Key, Target = p.Value }).ToList();

            return new GraphResponse { Nodes = nodes, Links = links };
        }

        public async Task<AnalyzeResponse> AnalyzeSentenceAsync(string sentence)
        {
            var response = new AnalyzeResponse();
            if (string.IsNullOrWhiteSpace(sentence))
            {
                return response;
            }

            // Split by whitespace and extract clean words
            var rawWords = sentence.Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);
            var uniqueCleanWords = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var rawWord in rawWords)
            {
                var clean = CleanWord(rawWord);
                if (!string.IsNullOrWhiteSpace(clean))
                {
                    uniqueCleanWords.Add(clean);
                }
            }

            foreach (var word in uniqueCleanWords)
            {
                var synonyms = await GetTransitiveSynonymsAsync(word);
                if (synonyms.Any())
                {
                    response.WordSynonyms[word.ToLowerInvariant()] = synonyms.ToList();
                }
            }

            return response;
        }

        public async Task<int> SeedFromExternalApiAsync()
        {
            var tasks = SeedBaseWords.Select(async baseWord =>
            {
                try
                {
                    // Request synonyms from Datamuse API (capped at 50 results to fetch balanced data)
                    var url = $"https://api.datamuse.com/words?rel_syn={Uri.EscapeDataString(baseWord)}&max=50";
                    var request = new HttpRequestMessage(HttpMethod.Get, url);
                    request.Headers.Add("User-Agent", "SynonymsApp-Backend");

                    var response = await _httpClient.SendAsync(request);
                    if (response.IsSuccessStatusCode)
                    {
                        var json = await response.Content.ReadAsStringAsync();
                        var apiWords = JsonSerializer.Deserialize<List<DatamuseWord>>(json, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (apiWords != null)
                        {
                            foreach (var item in apiWords)
                            {
                                if (!string.IsNullOrWhiteSpace(item.Word))
                                {
                                    // Add bidirectional edge between base word and its synonym
                                    await _repository.AddPairAsync(baseWord, item.Word);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    // Log or handle the exception gracefully so other requests continue
                    Console.WriteLine($"Error seeding word '{baseWord}': {ex.Message}");
                }
            });

            await Task.WhenAll(tasks);

            // Return the total count of words in storage
            var allWords = await _repository.GetAllWordsAsync();
            return allWords.Count();
        }

        public async Task<DeletePreviewResponse> GetDeletePreviewAsync(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return new DeletePreviewResponse();
            }

            var target = word.Trim().ToLowerInvariant();
            var firstConnections = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var secondConnections = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            // Get direct synonyms (distance 1)
            var direct = await _repository.GetDirectSynonymsAsync(target);
            foreach (var w1 in direct)
            {
                if (!w1.Equals(target, StringComparison.OrdinalIgnoreCase))
                {
                    firstConnections.Add(w1);
                }
            }

            // Get connections of connections (distance 2)
            foreach (var w1 in firstConnections)
            {
                var neighborsOfW1 = await _repository.GetDirectSynonymsAsync(w1);
                foreach (var w2 in neighborsOfW1)
                {
                    if (!w2.Equals(target, StringComparison.OrdinalIgnoreCase) && 
                        !firstConnections.Contains(w2))
                    {
                        secondConnections.Add(w2);
                    }
                }
            }

            return new DeletePreviewResponse
            {
                TargetWord = target,
                FirstConnections = firstConnections.OrderBy(w => w).ToList(),
                SecondConnections = secondConnections.OrderBy(w => w).ToList()
            };
        }

        public async Task DeleteWordAndConnectionsAsync(string word, string mode)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return;
            }

            var target = word.Trim().ToLowerInvariant();

            if (string.Equals(mode, "single", StringComparison.OrdinalIgnoreCase))
            {
                await _repository.DeleteWordsAsync(new[] { target });
            }
            else
            {
                var preview = await GetDeletePreviewAsync(target);
                var wordsToDelete = new List<string> { target };
                wordsToDelete.AddRange(preview.FirstConnections);
                wordsToDelete.AddRange(preview.SecondConnections);

                await _repository.DeleteWordsAsync(wordsToDelete);
            }
        }

        public async Task RenameWordAsync(string oldWord, string newWord)
        {
            await _repository.RenameWordAsync(oldWord, newWord);
        }

        public async Task DeleteRelationshipAsync(string word1, string word2)
        {
            await _repository.DeleteRelationshipAsync(word1, word2);
        }

        public async Task<IEnumerable<string>> GetDirectSynonymsAsync(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return Array.Empty<string>();
            }
            return await _repository.GetDirectSynonymsAsync(word.Trim().ToLowerInvariant());
        }

        private string CleanWord(string word)
        {
            if (string.IsNullOrEmpty(word)) return string.Empty;
            
            int start = 0;
            while (start < word.Length && char.IsPunctuation(word[start]))
            {
                start++;
            }
            
            int end = word.Length - 1;
            while (end >= start && char.IsPunctuation(word[end]))
            {
                end--;
            }
            
            if (start > end) return string.Empty;
            return word.Substring(start, end - start + 1);
        }

        private class DatamuseWord
        {
            [JsonPropertyName("word")]
            public string Word { get; set; } = string.Empty;
        }
    }
}
