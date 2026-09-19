import React from 'react';
import { CircuitDiagram } from './CircuitDiagram';
import { FunctionMachine } from './FunctionMachine';
import { CallStack } from './CallStack';
import { ArrayVisualizer } from './ArrayVisualizer';
import { GraphPlotter } from './GraphPlotter';
import { FlowChart } from './FlowChart';
import { StepThroughDiagram } from './StepThroughDiagram';
import { ProcessTimeline } from './ProcessTimeline';
import { BeforeAfterCompare } from './BeforeAfterCompare';

interface VisualRendererProps {
  spec?: {
    type?: string;
    params?: any;
  } | null;
}

export const VisualRenderer: React.FC<VisualRendererProps> = ({ spec }) => {
  if (!spec || !spec.type) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
        💡 Interactive conceptual diagram ready
      </div>
    );
  }

  const { type, params } = spec;

  switch (type.toLowerCase()) {
    case 'circuitdiagram':
    case 'circuit_diagram':
      return <CircuitDiagram {...(params || {})} />;

    case 'functionmachine':
    case 'function_machine':
      return <FunctionMachine params={params} />;

    case 'callstack':
    case 'call_stack':
      return <CallStack params={params} />;

    case 'arrayvisualizer':
    case 'array_visualizer':
      return <ArrayVisualizer params={params} />;

    case 'graphplotter':
    case 'graph_plotter':
      return <GraphPlotter params={params} />;

    case 'flowchart':
    case 'flow_chart':
      return <FlowChart params={params} />;

    case 'stepthroughdiagram':
    case 'step_through_diagram':
      return <StepThroughDiagram params={params} />;

    case 'processtimeline':
    case 'process_timeline':
      return <ProcessTimeline params={params} />;

    case 'beforeaftercompare':
    case 'before_after_compare':
      return <BeforeAfterCompare params={params} />;

    default:
      return <StepThroughDiagram params={params} />;
  }
};
