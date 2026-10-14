"""Actual LangGraph model/tool loop. All calls go through the benchmark service."""
import json
import os
import urllib.request
from typing import TypedDict
from langgraph.graph import StateGraph, START, END

url = os.environ['BENCHMARK_ENDPOINT']
def post(path, value):
    req = urllib.request.Request(url + path, data=json.dumps(value).encode(), headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)
with urllib.request.urlopen(url + '/input') as response:
    spec = json.load(response)
class State(TypedDict):
    messages: list
    calls: int

def model(state):
    body = {'model':spec['model'], 'messages':state['messages'], 'tools':[{'type':'function','function':{'name':'support','description':spec['toolDescription'],'parameters':spec['toolSchema']}}]}
    result = post('/v1/chat/completions', body)
    return {'messages':state['messages']+[result['choices'][0]['message']], 'calls':state['calls']+1}

def tools(state):
    messages = list(state['messages'])
    for call in messages[-1].get('tool_calls',[]):
        arguments = json.loads(call['function']['arguments'])
        result = post('/tool',arguments)
        messages.append({'role':'tool','tool_call_id':call['id'],'content':json.dumps(result)})
    return {'messages':messages}

def route(state):
    return 'tools' if state['messages'][-1].get('tool_calls') and state['calls'] < spec['maxCalls'] else END
builder=StateGraph(State)
builder.add_node('model',model)
builder.add_node('tools',tools)
builder.add_edge(START,'model')
builder.add_conditional_edges('model',route,['tools',END])
builder.add_edge('tools','model')
result=builder.compile().invoke({'messages':[{'role':'system','content':spec['system']},{'role':'user','content':spec['ticket']}],'calls':0},{'recursion_limit':30})
print('BENCHMARK_RESPONSE='+json.dumps(result['messages'][-1].get('content','')))
