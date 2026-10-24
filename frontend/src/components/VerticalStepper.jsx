import React, { useState, useEffect } from 'react';

const DEFAULT_STEPS = [
  {
    id: 1,
    title: 'First step: Read & Validate Stylesheet',
    desc: 'Reading file tokens and verifying CSS syntax structure',
  },
  {
    id: 2,
    title: 'Second step: AST Tokenization & Rule Parsing',
    desc: 'Extracting selectors, properties, variables and specificity',
  },
  {
    id: 3,
    title: 'Third step: Metrics & Design Token Computation',
    desc: 'Computing color tokens, property frequencies and rule density',
  },
  {
    id: 4,
    title: 'Fourth step: Groq AI Deep Audit & Recommendations',
    desc: 'Running 120B model review for accessibility, optimization & best practices',
  },
  {
    id: 5,
    title: 'Final step: Rendering Structured View Models',
    desc: 'Readying Cards, Table, Palette, Code, Tree & Analytics views',
  },
];

export default function VerticalStepper({ steps = DEFAULT_STEPS }) {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    // Progressively advance through the analysis pipeline steps while analyzing
    const t1 = setTimeout(() => setActiveStep(2), 450);
    const t2 = setTimeout(() => setActiveStep(3), 1100);
    const t3 = setTimeout(() => setActiveStep(4), 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="vertical-stepper-container" role="status" aria-label="CSS Analysis Pipeline Progress">
      <div className="stepper-title-banner">
        <span className="stepper-banner-badge">Analysis Pipeline</span>
        <h3 className="stepper-main-heading">Vertical Center Alignment</h3>
        <p className="stepper-sub-heading">Real-time processing steps for your CSS stylesheet</p>
      </div>

      <div className="vertical-stepper">
        {steps.map((step, idx) => {
          const isCompleted = activeStep > step.id;
          const isActive = activeStep === step.id;
          const isPending = activeStep < step.id;
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
            >
              {/* Center icon circle */}
              <div className="stepper-icon-wrapper">
                {isCompleted ? (
                  <div className="stepper-icon-circle completed" title="Step Completed">
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="stepper-icon-circle active" title="Step In Progress">
                    <div className="stepper-active-dot"></div>
                    <div className="stepper-active-pulse"></div>
                  </div>
                ) : (
                  <div className="stepper-icon-circle pending" title="Step Pending"></div>
                )}
              </div>

              {/* Title & Description center-aligned directly beneath circle */}
              <div className="stepper-content">
                <div className="stepper-step-title">{step.title}</div>
                <div className="stepper-step-desc">{step.desc}</div>
              </div>

              {/* Vertical connecting line */}
              {!isLast && (
                <div
                  className={`stepper-line ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
