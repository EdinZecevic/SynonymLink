using System.Collections.Generic;
using System.Threading.Tasks;

namespace SynonymsApp.Repositories
{
    public interface ISynonymRepository
    {
        Task AddPairAsync(string word1, string word2);
        Task<IEnumerable<string>> GetDirectSynonymsAsync(string word);
        Task<IEnumerable<KeyValuePair<string, string>>> GetAllPairsAsync();
        Task<IEnumerable<string>> GetAllWordsAsync();
    }
}
