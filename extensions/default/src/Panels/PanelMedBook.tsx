import React from 'react';

/**
 * Call Patient Panel - Promo panel for MRIgenius + Medbook patient education calls
 */
function PanelMedBook({
  commandsManager,
  servicesManager,
  extensionManager,
  configuration,
}: withAppTypes) {
  const handleSignUp = () => {
    window.open('https://medbook.co/auth/signup', '_blank');
  };

  const handleLearnMore = () => {
    window.open('https://medbook.co', '_blank');
  };

  return (
    <div className="ohif-scrollbar flex h-full flex-col overflow-auto">
      {/* Header */}
      <div className="bg-black px-4 py-4">
        <h2 className="text-lg font-bold text-white">Call your patient with report results!</h2>
      </div>

      <div className="flex-1 p-4">
        {/* Main Description */}
        <div className="mb-6">
          <p className="text-sm leading-relaxed text-white">
            Enhance your patient communication with educational phone calls to discuss MRI report
            results. Partner with <span className="font-semibold text-[#4DC0C0]">MRIgenius</span> and{' '}
            <span className="font-semibold text-[#4DC0C0]">Medbook</span> to streamline the process
            of explaining spine findings to your patients.
          </p>
        </div>

        {/* Features List */}
        <div className="mb-6 rounded-lg bg-secondary-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#4DC0C0]">Key Benefits</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-sm text-white">
              • Schedule patient education calls directly from DICOM reports
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm text-white">
              • Help patients understand their spine MRI findings
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm text-white">
              • Integrated workflow between MRIgenius and Medbook
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-sm text-white">
              • Improve patient engagement and treatment adherence
              </span>
            </li>
          </ul>
        </div>

        {/* How It Works */}
        <div className="mb-6 rounded-lg bg-secondary-dark p-4">
          <h3 className="mb-3 text-sm font-semibold text-[#4DC0C0]">How It Works</h3>
          <ol className="space-y-2 text-sm text-white">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4DC0C0] text-xs font-bold text-white">
                1
              </span>
              <span>Sign up on Medbook.co</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4DC0C0] text-xs font-bold text-white">
                2
              </span>
              <span>Upload the report from MRIgenius</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#4DC0C0] text-xs font-bold text-white">
                3
              </span>
              <span>Schedule an AI agent call to explain results to your patient</span>
            </li>
          </ol>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            className="w-full rounded-lg bg-[#4DC0C0] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3da8a8]"
            onClick={handleSignUp}
          >
            Sign Up on Medbook.co
          </button>
          <button
            className="w-full rounded-lg border border-[#4DC0C0] bg-transparent px-4 py-3 text-sm font-semibold text-[#4DC0C0] transition-colors hover:bg-[#4DC0C0]/10"
            onClick={handleLearnMore}
          >
            Learn More
          </button>
        </div>


      </div>
    </div>
  );
}

export default PanelMedBook;
