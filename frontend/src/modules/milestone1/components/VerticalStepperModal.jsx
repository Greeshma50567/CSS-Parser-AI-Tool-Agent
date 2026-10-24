import React, { useState, useEffect, useRef } from 'react';

const STEPS = [
  {
    id: 1,
    name: 'First Step',
    title: 'Read & Validate Stylesheet',
    desc: 'Reading file tokens and verifying CSS syntax structure',
  },
  {
    id: 2,
    name: 'Second Step',
    title: 'AST Tokenization & Rule Parsing',
    desc: 'Extracting selectors, properties, variables and specificity',
  },
  {
    id: 3,
    name: 'Third Step',
    title: 'Metrics & Design Token Computation',
    desc: 'Computing color tokens, property frequencies and rule density',
  },
  {
    id: 4,
    name: 'Fourth Step',
    title: 'Groq AI Deep Audit & Recommendations',
    desc: 'Running 120B model review for accessibility and best practices',
  },
  {
    id: 5,
    name: 'Fifth Step',
    title: 'Rendering Structured View Models',
    desc: 'Synthesizing Cards, Table, Palette, Code, Tree & Analytics',
  },
];

export default function VerticalStepperModal({
  isOpen,
  isApiDone,
  onComplete,
  filename = 'stylesheet.css'
}) {
  const [activeStep, setActiveStep] = useState(1);
  const [completedAll, setCompletedAll] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Keep refs for live values to prevent re-triggering effects or stale closures
  const apiDoneRef = useRef(isApiDone);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    apiDoneRef.current = isApiDone;
  }, [isApiDone]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(1);
      setCompletedAll(false);
      setIsClosing(false);
      return;
    }

    let isCancelled = false;
    setActiveStep(1);
    setCompletedAll(false);
    setIsClosing(false);

    // Continuous, single-direction monotonic workflow:
    // Step 1 -> Step 2 -> Step 3 -> Step 4 (await API) -> Step 5 -> Completion
    // Each step is guaranteed to proceed in exact sequence without skipping or repeating.

    // 1. First Step -> Second Step (600ms)
    const t1 = setTimeout(() => {
      if (isCancelled) return;
      setActiveStep(2);

      // 2. Second Step -> Third Step (650ms)
      const t2 = setTimeout(() => {
        if (isCancelled) return;
        setActiveStep(3);

        // 3. Third Step -> Fourth Step (650ms)
        const t3 = setTimeout(() => {
          if (isCancelled) return;
          setActiveStep(4);

          // 4. Fourth Step (Groq AI Audit):
          // Seamlessly display Step 4 for at least 650ms, then advance as soon as API is ready
          const step4StartTime = Date.now();
          const pollInterval = setInterval(() => {
            if (isCancelled) {
              clearInterval(pollInterval);
              return;
            }

            const elapsed = Date.now() - step4StartTime;
            if (elapsed >= 650 && apiDoneRef.current) {
              clearInterval(pollInterval);

              // 5. Fourth Step -> Fifth Step
              setActiveStep(5);

              // 6. Fifth Step (Rendering Structured Views) -> Complete (650ms)
              const t5 = setTimeout(() => {
                if (isCancelled) return;
                setActiveStep(6);
                setCompletedAll(true);

                // 7. Celebrate completion for 500ms, then smoothly fade out & reveal results
                const tComplete = setTimeout(() => {
                  if (isCancelled) return;
                  setIsClosing(true);

                  // Allow 250ms for smooth exit animation
                  const tExit = setTimeout(() => {
                    if (isCancelled) return;
                    if (onCompleteRef.current) {
                      onCompleteRef.current();
                    }
                  }, 250);
                }, 500);
              }, 650);
            }
          }, 80);

        }, 650);
      }, 650);
    }, 600);

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`stepper-modal-overlay ${isClosing ? 'modal-fade-out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="stepper-modal-title"
    >
      <div className={`stepper-modal-card ${isClosing ? 'modal-card-exit' : ''}`}>
        {/* Top Header */}
        <div className="stepper-modal-header">
          <div className="stepper-modal-badge">
            <span className="stepper-modal-pulse-dot"></span>
            <span>ANALYSIS PIPELINE</span>
          </div>
          <h3 id="stepper-modal-title" className="stepper-modal-title">
            CSS Inspection &amp; AI Audit
          </h3>
          <p className="stepper-modal-sub">
            {filename ? `Analyzing ${filename} — ` : ''}Real-time processing steps for your stylesheet
          </p>
        </div>

        {/* Side-Aligned Vertical Stepper */}
        <div className="stepper-modal-body">
          <div className="side-vertical-stepper">
            {STEPS.map((step, idx) => {
              const isCompleted = activeStep > step.id;
              const isActive = activeStep === step.id;
              const isPending = activeStep < step.id;
              const isLast = idx === STEPS.length - 1;

              return (
                <div
                  key={step.id}
                  className={`side-stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${isPending ? 'pending' : ''}`}
                >
                  {/* Left Side Track: Circle and Connector Line */}
                  <div className="side-stepper-track">
                    <div className="side-stepper-icon-wrap">
                      {isCompleted ? (
                        <div className="side-stepper-circle completed" title="Completed">
                          <svg
                            viewBox="0 0 16 16"
                            width="15"
                            height="15"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                          </svg>
                        </div>
                      ) : isActive ? (
                        <div className="side-stepper-circle active" title="In Progress">
                          <div className="side-stepper-inner-dot"></div>
                          <div className="side-stepper-radar"></div>
                        </div>
                      ) : (
                        <div className="side-stepper-circle pending" title="Pending">
                          <span className="side-stepper-num">{step.id}</span>
                        </div>
                      )}
                    </div>

                    {!isLast && (
                      <div
                        className={`side-stepper-connector ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                      />
                    )}
                  </div>

                  {/* Right Side Details: Vertically Center Aligned with the Circle */}
                  <div className="side-stepper-details">
                    <div className="side-stepper-title-row">
                      <span className="side-stepper-step-num">{step.name}:</span>
                      <span className="side-stepper-title">{step.title}</span>
                    </div>
                    <div className="side-stepper-desc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="stepper-modal-footer">
          {completedAll ? (
            <div className="stepper-modal-success-badge">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style={{ marginRight: '6px' }}>
                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
              </svg>
              All Pipeline Steps Completed Successfully!
            </div>
          ) : (
            <div className="stepper-modal-status-text">
              <span className="stepper-modal-spinner"></span>
              <span>
                {activeStep === 1 && 'Step 1/5: Reading stylesheet & verifying CSS structure...'}
                {activeStep === 2 && 'Step 2/5: Building AST token tree & extracting selectors...'}
                {activeStep === 3 && 'Step 3/5: Computing color tokens, specificity & metrics...'}
                {activeStep === 4 && 'Step 4/5: Running Groq 120B AI model review...'}
                {activeStep >= 5 && 'Step 5/5: Preparing structured view models & visualizations...'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
