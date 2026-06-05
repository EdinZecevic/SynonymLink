using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SynonymsApp.Models;
using SynonymsApp.Services;

namespace SynonymsApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SynonymsController : ControllerBase
    {
        private readonly ISynonymService _synonymService;

        public SynonymsController(ISynonymService synonymService)
        {
            _synonymService = synonymService;
        }

        [HttpPost]
        public async Task<IActionResult> AddSynonymPair([FromBody] SynonymPair pair)
        {
            if (pair == null || string.IsNullOrWhiteSpace(pair.Word1) || string.IsNullOrWhiteSpace(pair.Word2))
            {
                return BadRequest(new { Message = "Both Word1 and Word2 must be provided." });
            }

            if (pair.Word1.Trim().Equals(pair.Word2.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { Message = "A word cannot be a synonym of itself." });
            }

            try
            {
                await _synonymService.AddSynonymPairAsync(pair.Word1, pair.Word2);
                return Ok(new { Message = "Synonym pair added successfully." });
            }
            catch (InvalidOperationException ex)
            {
                // Return Bad Request if database word limit / rate limit is exceeded
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet("{word}")]
        public async Task<IActionResult> GetSynonyms(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return BadRequest(new { Message = "Word parameter cannot be empty." });
            }

            var synonyms = await _synonymService.GetTransitiveSynonymsAsync(word);
            return Ok(synonyms);
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeSentence([FromBody] AnalyzeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Sentence))
            {
                return BadRequest(new { Message = "Sentence cannot be empty." });
            }

            var analysis = await _synonymService.AnalyzeSentenceAsync(request.Sentence);
            return Ok(analysis);
        }

        [HttpGet("graph")]
        public async Task<IActionResult> GetGraph()
        {
            var graph = await _synonymService.GetSynonymGraphAsync();
            return Ok(graph);
        }

        [HttpPost("seed-external")]
        public async Task<IActionResult> SeedFromExternal()
        {
            try
            {
                var totalWords = await _synonymService.SeedFromExternalApiAsync();
                return Ok(new 
                { 
                    Message = "External seeding completed successfully.", 
                    TotalWords = totalWords 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error occurred during seeding.", Error = ex.Message });
            }
        }

        [HttpGet("{word}/delete-preview")]
        public async Task<IActionResult> GetDeletePreview(string word)
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return BadRequest(new { Message = "Word parameter cannot be empty." });
            }

            var preview = await _synonymService.GetDeletePreviewAsync(word);
            return Ok(preview);
        }

        [HttpDelete("{word}")]
        public async Task<IActionResult> DeleteWord(string word, [FromQuery] string mode = "cascade")
        {
            if (string.IsNullOrWhiteSpace(word))
            {
                return BadRequest(new { Message = "Word parameter cannot be empty." });
            }

            try
            {
                await _synonymService.DeleteWordAndConnectionsAsync(word, mode);
                return Ok(new { Message = $"Word '{word}' deleted successfully using mode '{mode}'." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "Error occurred during deletion.", Error = ex.Message });
            }
        }
    }
}

