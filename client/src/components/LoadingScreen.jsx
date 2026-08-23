export default function LoadingScreen({ text = 'Preparing your invitation...' }) {
  return (
    <div className="loading-screen">
      <div className="lotus-mark">✦</div>
      <p>{text}</p>
    </div>
  );
}
