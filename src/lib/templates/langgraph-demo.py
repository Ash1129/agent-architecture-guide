"""Credential-free mechanics demo. No models, network calls or real actions.

Run from this folder: python graph.py
InMemorySaver only survives within this process. Read README.md before adapting.
"""
import hashlib
import json
from operator import add
from pathlib import Path
from typing import Annotated, TypedDict
from uuid import uuid4

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class State(TypedDict):
    task: str
    findings: Annotated[list[dict], add]
    proposal: dict
    approved: bool
    outcome: str


def proposal_id(proposal: dict) -> str:
    return hashlib.sha256(json.dumps(proposal, sort_keys=True).encode()).hexdigest()


def build_graph(roles: list[str], checkpointer):
    if not roles or any(not isinstance(role, str) or not role.strip() for role in roles):
        raise ValueError("At least one nonempty specialist role is required")
    builder = StateGraph(State)

    def specialist(role):
        def run(state):
            # Replace with a validated, read-only adapter using system-prompt.md.
            return {"findings": [{"role": role, "text": "Fixture finding", "fixture": True}]}
        return run

    workers = []
    for index, role in enumerate(roles):
        name = f"specialist_{index}"
        workers.append(name)
        builder.add_node(name, specialist(role))
        builder.add_edge(START, name)

    def combine(state):
        findings = sorted(state["findings"], key=lambda item: item["role"])
        return {"proposal": {"task": state["task"], "findings": findings, "mode": "simulation"}}

    def review(state):
        digest = proposal_id(state["proposal"])
        decision = interrupt({"proposal": state["proposal"], "proposal_id": digest})
        # This validates payload binding, not user identity. Authenticate in the service.
        if not isinstance(decision, dict) or type(decision.get("approved")) is not bool:
            raise ValueError("Approval must be an explicit Boolean")
        if decision.get("proposal_id") != digest:
            raise ValueError("Approval belongs to another proposal")
        return {"approved": decision["approved"]}

    def finish(state):
        # Deliberately no write adapter. Approval only completes this simulation.
        return {"outcome": "simulated" if state["approved"] else "rejected"}

    builder.add_node("combine", combine)
    builder.add_node("review", review)
    builder.add_node("finish", finish)
    builder.add_edge(workers, "combine")
    builder.add_edge("combine", "review")
    builder.add_edge("review", "finish")
    builder.add_edge("finish", END)
    return builder.compile(checkpointer=checkpointer)


if __name__ == "__main__":
    design = json.loads(Path(__file__).with_name("design.json").read_text())
    graph = build_graph(design["specialists"], InMemorySaver())
    config = {"configurable": {"thread_id": str(uuid4())}, "recursion_limit": 12}
    paused = graph.invoke({"task": design["task"], "findings": []}, config)
    request = paused["__interrupt__"][0].value
    print(json.dumps(request, indent=2))
    choice = input("Approve this simulation? Type yes; anything else rejects: ")
    result = graph.invoke(Command(resume={"approved": choice == "yes", "proposal_id": request["proposal_id"]}), config)
    print(json.dumps({"outcome": result["outcome"], "external_actions": 0}))
