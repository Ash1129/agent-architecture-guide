"""Run with: uv run --with 'langgraph==1.2.14' python scripts/smoke/langgraph_smoke.py"""
import importlib.metadata
import importlib.util
from pathlib import Path
import unittest

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.errors import GraphRecursionError
from langgraph.types import Command

source = Path(__file__).resolve().parents[2] / "src/lib/templates/langgraph-demo.py"
spec = importlib.util.spec_from_file_location("starter", source)
starter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(starter)


class StarterSmoke(unittest.TestCase):
    def setUp(self):
        self.graph = starter.build_graph(["Research", "Verify", "Summarize"], InMemorySaver())
        self.config = {"configurable": {"thread_id": self.id()}, "recursion_limit": 12}

    def pause(self):
        result = self.graph.invoke({"task": "Synthetic case", "findings": []}, self.config)
        self.assertNotIn("outcome", result)
        self.assertEqual(len(result["findings"]), 3)
        return result["__interrupt__"][0].value

    def test_approve(self):
        request = self.pause()
        result = self.graph.invoke(Command(resume={"approved": True, "proposal_id": request["proposal_id"]}), self.config)
        self.assertEqual(result["outcome"], "simulated")
        self.assertEqual(len(result["findings"]), 3)

    def test_reject(self):
        request = self.pause()
        result = self.graph.invoke(Command(resume={"approved": False, "proposal_id": request["proposal_id"]}), self.config)
        self.assertEqual(result["outcome"], "rejected")

    def test_stale_approval(self):
        self.pause()
        with self.assertRaisesRegex(ValueError, "another proposal"):
            self.graph.invoke(Command(resume={"approved": True, "proposal_id": "stale"}), self.config)
        self.assertNotIn("outcome", self.graph.get_state(self.config).values)

    def test_string_is_not_approval(self):
        request = self.pause()
        with self.assertRaisesRegex(ValueError, "Boolean"):
            self.graph.invoke(Command(resume={"approved": "false", "proposal_id": request["proposal_id"]}), self.config)
        self.assertNotIn("outcome", self.graph.get_state(self.config).values)

    def test_thread_isolation(self):
        self.pause()
        other = {"configurable": {"thread_id": "different-case"}, "recursion_limit": 12}
        self.assertEqual(self.graph.get_state(other).values, {})
        result = self.graph.invoke({"task": "Other case", "findings": []}, other)
        self.assertEqual(result["task"], "Other case")
        self.assertEqual(self.graph.get_state(self.config).values["task"], "Synthetic case")

    def test_step_budget(self):
        config = {**self.config, "recursion_limit": 1}
        with self.assertRaises(GraphRecursionError):
            self.graph.invoke({"task": "Synthetic case", "findings": []}, config)
        self.assertNotIn("outcome", self.graph.get_state(config).values)


if __name__ == "__main__":
    print("LangGraph", importlib.metadata.version("langgraph"), flush=True)
    unittest.main(verbosity=2)
