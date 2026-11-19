// Hình quẻ: 6 hào vẽ từ bits (hào 1 ở dưới cùng), hào động đánh dấu ●.
export default function HexFigure({ bits, dongList = [], mini = false }) {
  return (
    <div className={"hexlines" + (mini ? " mini" : "")} aria-hidden="true">
      {bits.map((b, i) =>
        b === 1 ? (
          <div className="hl" key={i}>
            <div className="seg" />
            <span className="mk">{dongList.includes(i + 1) ? "● động" : ""}</span>
          </div>
        ) : (
          <div className="hl am" key={i}>
            <div className="seg">
              <i />
            </div>
            <span className="mk">{dongList.includes(i + 1) ? "● động" : ""}</span>
          </div>
        )
      )}
    </div>
  );
}
