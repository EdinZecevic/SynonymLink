using System.Collections.Generic;

namespace SynonymsApp.Models
{
    public class SynonymPair
    {
        public string Word1 { get; set; } = string.Empty;
        public string Word2 { get; set; } = string.Empty;
    }

    public class GraphNode
    {
        public string Id { get; set; } = string.Empty;
        public int Group { get; set; }
    }

    public class GraphLink
    {
        public string Source { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
    }

    public class GraphResponse
    {
        public List<GraphNode> Nodes { get; set; } = new();
        public List<GraphLink> Links { get; set; } = new();
    }

    public class AnalyzeRequest
    {
        public string Sentence { get; set; } = string.Empty;
    }

    public class AnalyzeResponse
    {
        public Dictionary<string, List<string>> WordSynonyms { get; set; } = new();
    }

    public class DeletePreviewResponse
    {
        public string TargetWord { get; set; } = string.Empty;
        public List<string> FirstConnections { get; set; } = new();
        public List<string> SecondConnections { get; set; } = new();
    }
}
