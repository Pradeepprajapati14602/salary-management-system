import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function stroke(s: number): IconProps {
  return {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
}

/** Navigation — people list */
export function IconUsers({ size = 18, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Navigation — bar chart */
export function IconChart({ size = 18, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 16V9M12 16v-5M17 16V6" />
    </svg>
  );
}

export function IconClose({ size = 18, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconSearch({ size = 40, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function IconPencil({ size = 18, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function IconTrash({ size = 18, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconAlert({ size = 40, ...p }: IconProps) {
  return (
    <svg {...stroke(size)} {...p}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
