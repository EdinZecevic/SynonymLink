using System.Collections.Generic;
using System.Threading.Tasks;
using SynonymsApp.Models;

namespace SynonymsApp.Services
{
    public interface ISynonymService
    {
        Task AddSynonymPairAsync(string word1, string word2);
        Task<IEnumerable<string>> GetTransitiveSynonymsAsync(string word);
        Task<GraphResponse> GetSynonymGraphAsync();
        Task<AnalyzeResponse> AnalyzeSentenceAsync(string sentence);
        Task<int> SeedFromExternalApiAsync();
        Task<DeletePreviewResponse> GetDeletePreviewAsync(string word);
        Task DeleteWordAndConnectionsAsync(string word, string mode);
    }
}
