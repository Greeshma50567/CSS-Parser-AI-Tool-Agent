import React, { useState, useRef } from 'react';

function fmtBytes(b) {
  if (!b) return '';
  const k = 1024, sz = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + sz[i];
}

export default function DropZone({ file, onFile }) {
  const [drag, setDrag] = useState(false);
  const ref = useRef();

  return (
    <div>
      <div
        className={drag ? 'dropzone drag-over' : 'dropzone'}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
        onClick={() => ref.current && ref.current.click()}
      >
        <input
          ref={ref}
          type="file"
          accept=".css"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files[0]; if (f) onFile(f); }}
        />
        <div className="dropzone-icon">📁</div>
        <div className="dropzone-title">Drop your CSS file here</div>
        <div className="dropzone-sub">or click to browse — .css files only</div>
      </div>
      {file && (
        <div className="file-selected">
          <span className="file-icon">📄</span>
          <div>
            <div className="file-name">{file.name}</div>
            <div className="file-size">{fmtBytes(file.size)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
