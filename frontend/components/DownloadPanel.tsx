"use client";

interface DownloadPanelProps {
  selectedCount: number;
  onDownload: () => void;
  onReset: () => void;
}

export default function DownloadPanel({
  selectedCount,
  onDownload,
  onReset,
}: DownloadPanelProps) {
  return (
    <section className="card p-6 bg-[var(--success-glow)] border-[var(--success)]/20" aria-labelledby="download-heading">
      <div className="flex items-start gap-4">
        <div className="text-4xl">✅</div>
        <div className="flex-1">
          <h3 id="download-heading" className="text-xl font-semibold mb-2 text-[var(--success)]">
            Ready to Download
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {selectedCount} design{selectedCount > 1 ? "s" : ""} selected for download
          </p>

          <div className="card p-4 mb-4 border-[var(--success)]/20">
            <h4 className="font-semibold text-sm mb-2">File Specifications</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--text-secondary)]">Format:</dt>
                <dd className="font-medium">TIFF (Layered)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-secondary)]">Resolution:</dt>
                <dd className="font-medium">300 DPI</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-secondary)]">Color Mode:</dt>
                <dd className="font-medium">CMYK</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-secondary)]">Pattern Type:</dt>
                <dd className="font-medium">Seamless Repeat</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--text-secondary)]">Est. File Size:</dt>
                <dd className="font-medium">~{selectedCount * 25}MB</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onDownload}
              className="btn btn-primary flex-1"
              aria-label={`Download ${selectedCount} selected design variations`}
            >
              <span className="flex items-center justify-center gap-2">
                <span className="text-xl">⬇️</span>
                Download Print-Ready File{selectedCount > 1 ? "s" : ""}
              </span>
            </button>

            <button
              onClick={onReset}
              className="btn btn-secondary"
              aria-label="Start new design"
            >
              New Design
            </button>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-3">
            💡 Files are optimized for direct use with digital textile printers. Test print recommended for color calibration.
          </p>
        </div>
      </div>
    </section>
  );
}
