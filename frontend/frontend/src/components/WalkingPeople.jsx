export default function WalkingPeople() {
  return (
    <div style={{ overflow: "hidden", width: "100%", marginTop: "10px" }}>
      
      <svg
        width="100%"
        height="220"
        viewBox="0 0 1000 220"
      >

        {/* ✅ CLIP AREA (prevents extra person) */}
        <defs>
          <clipPath id="clipArea">
            <rect x="50" y="0" width="900" height="220" />
          </clipPath>
        </defs>

        {/* PATH */}
        <path
  id="walkPath"
  d="M 0 180 L 1000 120"
  fill="transparent"
  stroke="#a3b18a"
  strokeWidth="2"
/>

        {/* ✅ PEOPLE WRAPPED INSIDE CLIP */}
        <g clipPath="url(#clipArea)">
          {[0, 2, 4, 6, 8].map((delay, i) => (
            <g key={i} transform="scale(1.6)">

              {/* HEAD */}
              <circle cx="0" cy="0" r="8" fill="#1b4332" />

              {/* BODY */}
              <line x1="0" y1="8" x2="0" y2="30" stroke="#1b4332" strokeWidth="3" />

              {/* ARMS */}
              <line x1="0" y1="14" x2="10" y2="8" stroke="#1b4332" strokeWidth="3" />
              <line x1="0" y1="14" x2="-10" y2="8" stroke="#1b4332" strokeWidth="3" />

              {/* LEGS */}
              <line x1="0" y1="30" x2="10" y2="45" stroke="#1b4332" strokeWidth="3" />
              <line x1="0" y1="30" x2="-10" y2="45" stroke="#1b4332" strokeWidth="3" />

              {/* PLANT */}
              <line x1="12" y1="5" x2="12" y2="-12" stroke="#2d6a4f" strokeWidth="3" />
              <ellipse cx="8" cy="-14" rx="4" ry="2" fill="#52b788" />
              <ellipse cx="16" cy="-14" rx="4" ry="2" fill="#52b788" />

              {/* MOTION */}
              <animateMotion
                dur="12s"
                begin={`${delay}s`}
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href="#walkPath" />
              </animateMotion>

            </g>
          ))}
        </g>

      </svg>
    </div>
  );
}