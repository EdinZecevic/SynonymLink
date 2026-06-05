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

        [Fact]
        public async Task GetDeletePreview_ShouldIncludeFirstAndSecondLevelConnectionsOnly()
        {
            // Arrange: target - B (1st) - C (2nd) - D (3rd)
            await _service.AddSynonymPairAsync("target", "B");
            await _service.AddSynonymPairAsync("B", "C");
            await _service.AddSynonymPairAsync("C", "D");

            // Act
            var preview = await _service.GetDeletePreviewAsync("target");

            // Assert
            Assert.Equal("target", preview.TargetWord);
            
            // First level: B
            Assert.Single(preview.FirstConnections);
            Assert.Contains("b", preview.FirstConnections);

            // Second level: C
            Assert.Single(preview.SecondConnections);
            Assert.Contains("c", preview.SecondConnections);

            // D should not be in preview (it is 3rd level)
            Assert.DoesNotContain("d", preview.FirstConnections);
            Assert.DoesNotContain("d", preview.SecondConnections);
        }

        [Fact]
        public async Task GetDeletePreview_ShouldHandleCircularAndMultiplePaths()
        {
            // Arrange circular and multi-path graph:
            // target - B
            // target - C
            // B - C (circular)
            // B - D
            await _service.AddSynonymPairAsync("target", "B");
            await _service.AddSynonymPairAsync("target", "C");
            await _service.AddSynonymPairAsync("B", "C");
            await _service.AddSynonymPairAsync("B", "D");

            // Act
            var preview = await _service.GetDeletePreviewAsync("target");

            // Assert
            Assert.Equal("target", preview.TargetWord);
            
            // First level: B, C
            Assert.Equal(2, preview.FirstConnections.Count);
            Assert.Contains("b", preview.FirstConnections);
            Assert.Contains("c", preview.FirstConnections);

            // Second level: D (B is connected to D. C is connected to B, but B is already in 1st level, so only D remains)
            Assert.Single(preview.SecondConnections);
            Assert.Contains("d", preview.SecondConnections);
        }

        [Fact]
        public async Task DeleteWord_SingleMode_ShouldOnlyRemoveTargetWordAndSeverConnections()
        {
            // Arrange: A - B - C
            await _service.AddSynonymPairAsync("A", "B");
            await _service.AddSynonymPairAsync("B", "C");

            // Act: delete B in single mode
            await _service.DeleteWordAndConnectionsAsync("B", "single");

            // Assert: B is removed, but A and C remain (though they are no longer connected because B was the bridge)
            var allWords = (await _repository.GetAllWordsAsync()).ToList();
            Assert.DoesNotContain("b", allWords);
            Assert.Contains("a", allWords);
            Assert.Contains("c", allWords);

            // A's direct synonyms should be empty
            var synonymsForA = await _repository.GetDirectSynonymsAsync("a");
            Assert.Empty(synonymsForA);

            // C's direct synonyms should be empty
            var synonymsForC = await _repository.GetDirectSynonymsAsync("c");
            Assert.Empty(synonymsForC);
        }

        [Fact]
        public async Task DeleteWord_CascadeMode_ShouldDeleteTargetAndFirstAndSecondLevelConnections()
        {
            // Arrange: target - B (1st) - C (2nd) - D (3rd) - E (4th)
            await _service.AddSynonymPairAsync("target", "B");
            await _service.AddSynonymPairAsync("B", "C");
            await _service.AddSynonymPairAsync("C", "D");
            await _service.AddSynonymPairAsync("D", "E");

            // Act: delete target in cascade mode
            await _service.DeleteWordAndConnectionsAsync("target", "cascade");

            // Assert: target, B, C are removed. D, E remain.
            var allWords = (await _repository.GetAllWordsAsync()).ToList();
            Assert.DoesNotContain("target", allWords);
            Assert.DoesNotContain("b", allWords);
            Assert.DoesNotContain("c", allWords);
            Assert.Contains("d", allWords);
            Assert.Contains("e", allWords);

            // D - E connection should still exist
            var synonymsForD = await _repository.GetDirectSynonymsAsync("d");
            Assert.Contains("e", synonymsForD);

            var synonymsForE = await _repository.GetDirectSynonymsAsync("e");
            Assert.Contains("d", synonymsForE);
        }
    }
}
