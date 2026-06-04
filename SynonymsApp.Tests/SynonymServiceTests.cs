using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using SynonymsApp.Models;
using SynonymsApp.Repositories;
using SynonymsApp.Services;
using Xunit;

namespace SynonymsApp.Tests
{
    public class SynonymServiceTests
    {
        private readonly ISynonymRepository _repository;
        private readonly ISynonymService _service;

        public SynonymServiceTests()
        {
            // Set up a fresh in-memory repository for each test
            _repository = new InMemorySynonymRepository();
            
            // Setup a dummy HttpClient since seeding is not explicitly tested here
            var httpClient = new HttpClient();
            _service = new SynonymService(_repository, httpClient);
        }

        [Fact]
        public async Task AddSynonymPair_ShouldBeBidirectional()
        {
            // Arrange & Act
            await _service.AddSynonymPairAsync("clean", "wash");

            // Assert
            var synonymsForClean = await _service.GetTransitiveSynonymsAsync("clean");
            var synonymsForWash = await _service.GetTransitiveSynonymsAsync("wash");

            Assert.Contains("wash", synonymsForClean);
            Assert.Contains("clean", synonymsForWash);
            Assert.Single(synonymsForClean);
            Assert.Single(synonymsForWash);
        }

        [Fact]
        public async Task GetTransitiveSynonyms_ShouldResolveTransitiveBonus()
        {
            // Arrange: A = B, B = C
            await _service.AddSynonymPairAsync("A", "B");
            await _service.AddSynonymPairAsync("B", "C");

            // Act
            var synonymsForA = (await _service.GetTransitiveSynonymsAsync("A")).ToList();
            var synonymsForB = (await _service.GetTransitiveSynonymsAsync("B")).ToList();
            var synonymsForC = (await _service.GetTransitiveSynonymsAsync("C")).ToList();

            // Assert
            // Searching for A returns B and C
            Assert.Equal(2, synonymsForA.Count);
            Assert.Contains("b", synonymsForA);
            Assert.Contains("c", synonymsForA);

            // Searching for C returns A and B
            Assert.Equal(2, synonymsForC.Count);
            Assert.Contains("a", synonymsForC);
            Assert.Contains("b", synonymsForC);

            // Searching for B returns A and C
            Assert.Equal(2, synonymsForB.Count);
            Assert.Contains("a", synonymsForB);
            Assert.Contains("c", synonymsForB);
        }

        [Fact]
        public async Task GetTransitiveSynonyms_ShouldHandleCircularRelations()
        {
            // Arrange: A = B, B = C, C = A
            await _service.AddSynonymPairAsync("A", "B");
            await _service.AddSynonymPairAsync("B", "C");
            await _service.AddSynonymPairAsync("C", "A");

            // Act
            var synonymsForA = (await _service.GetTransitiveSynonymsAsync("A")).ToList();

            // Assert: no infinite loop, returns exactly the other two words
            Assert.Equal(2, synonymsForA.Count);
            Assert.Contains("b", synonymsForA);
            Assert.Contains("c", synonymsForA);
            Assert.DoesNotContain("a", synonymsForA);
        }

        [Fact]
        public async Task GetTransitiveSynonyms_ShouldSeparateDisjointClusters()
        {
            // Arrange: Cluster 1 (A = B), Cluster 2 (C = D)
            await _service.AddSynonymPairAsync("A", "B");
            await _service.AddSynonymPairAsync("C", "D");

            // Act
            var synonymsForA = (await _service.GetTransitiveSynonymsAsync("A")).ToList();
            var synonymsForC = (await _service.GetTransitiveSynonymsAsync("C")).ToList();

            // Assert
            Assert.Single(synonymsForA);
            Assert.Contains("b", synonymsForA);
            Assert.DoesNotContain("c", synonymsForA);
            Assert.DoesNotContain("d", synonymsForA);

            Assert.Single(synonymsForC);
            Assert.Contains("d", synonymsForC);
            Assert.DoesNotContain("a", synonymsForC);
            Assert.DoesNotContain("b", synonymsForC);
        }

        [Fact]
        public async Task AnalyzeSentence_ShouldExtractSynonymsAndStripPunctuation()
        {
            // Arrange
            await _service.AddSynonymPairAsync("fast", "quick");
            await _service.AddSynonymPairAsync("quick", "rapid");
            await _service.AddSynonymPairAsync("happy", "joyful");

            // Act
            var response = await _service.AnalyzeSentenceAsync("The runner was fast, quick, and happy!");

            // Assert
            Assert.NotNull(response);
            Assert.Contains("fast", response.WordSynonyms.Keys);
            Assert.Contains("quick", response.WordSynonyms.Keys);
            Assert.Contains("happy", response.WordSynonyms.Keys);
            Assert.DoesNotContain("the", response.WordSynonyms.Keys); // no synonyms configured for "the"

            // "fast" should return ["quick", "rapid"]
            var fastSynonyms = response.WordSynonyms["fast"];
            Assert.Contains("quick", fastSynonyms);
            Assert.Contains("rapid", fastSynonyms);

            // "happy" should return ["joyful"]
            var happySynonyms = response.WordSynonyms["happy"];
            Assert.Contains("joyful", happySynonyms);
        }

        [Fact]
        public async Task GetSynonymGraph_ShouldGenerateNodesAndComponentGroups()
        {
            // Arrange: Cluster 1 (clean-wash-purify), Cluster 2 (fast-quick)
            await _service.AddSynonymPairAsync("clean", "wash");
            await _service.AddSynonymPairAsync("wash", "purify");
            await _service.AddSynonymPairAsync("fast", "quick");

            // Act
            var graph = await _service.GetSynonymGraphAsync();

            // Assert
            Assert.NotNull(graph);
            Assert.Equal(5, graph.Nodes.Count); // clean, wash, purify, fast, quick
            Assert.Equal(3, graph.Links.Count); // clean-wash, wash-purify, fast-quick

            // Verify clean, wash, purify have the same Group ID
            var cleanNode = graph.Nodes.First(n => n.Id.Equals("clean", StringComparison.OrdinalIgnoreCase));
            var washNode = graph.Nodes.First(n => n.Id.Equals("wash", StringComparison.OrdinalIgnoreCase));
            var purifyNode = graph.Nodes.First(n => n.Id.Equals("purify", StringComparison.OrdinalIgnoreCase));
            
            Assert.Equal(cleanNode.Group, washNode.Group);
            Assert.Equal(washNode.Group, purifyNode.Group);

            // Verify fast, quick have the same Group ID, different from Cluster 1
            var fastNode = graph.Nodes.First(n => n.Id.Equals("fast", StringComparison.OrdinalIgnoreCase));
            var quickNode = graph.Nodes.First(n => n.Id.Equals("quick", StringComparison.OrdinalIgnoreCase));

            Assert.Equal(fastNode.Group, quickNode.Group);
            Assert.NotEqual(cleanNode.Group, fastNode.Group);
        }

        [Fact]
        public async Task AddSynonymPair_ShouldThrowException_WhenLimitOf5000WordsIsExceeded()
        {
            // Arrange
            // Load 5000 unique words (2500 pairs) into the empty repository
            for (int i = 0; i < 2500; i++)
            {
                await _service.AddSynonymPairAsync($"worda{i}", $"wordb{i}");
            }

            // Act & Assert:
            // 1. Adding a completely new pair (2 new words) should throw
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _service.AddSynonymPairAsync("newword1", "newword2");
            });

            // 2. Adding a pair with 1 new word and 1 existing word should throw
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await _service.AddSynonymPairAsync("newword1", "worda0");
            });

            // 3. Adding an relationship between two already existing words should succeed
            // since it introduces no new words to the database
            await _service.AddSynonymPairAsync("worda0", "wordb1");
        }
    }
}
