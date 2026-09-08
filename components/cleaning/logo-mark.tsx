// components/cleaning/logo-mark.tsx
// 오염파이터 로고 마크 — 첫 자음 ㅇ을 끊긴 고리로 두고, 그 자리에 물방울을 놓았다.
// 색은 currentColor를 따르므로 부모에서 color만 지정하면 된다.

type LogoMarkProps = {
  size?: number;
  className?: string;
};

export default function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="오염파이터"
    >
      {/* 끊긴 고리 — 12시에서 3시 구간을 비워 걷어낸 자리를 만든다 */}
      <path
        d="M24 6.5 A17.5 17.5 0 1 0 41.5 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* 비운 자리에 놓이는 물방울 */}
      <path
        d="M35.5 4.6 C38.7 9.4 41.6 12.5 41.6 15.6 A6.1 6.1 0 1 1 29.4 15.6 C29.4 12.5 32.3 9.4 35.5 4.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}
