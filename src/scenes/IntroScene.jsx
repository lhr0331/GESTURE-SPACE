export default function IntroScene({ onEnter }) {
  return <section className="intro-screen" aria-label="Introduction">
    <div className="intro-index">AN EXPERIMENT IN HUMAN / MACHINE CONTACT <span>001—006</span></div>
    <div className="intro-center">
      <div className="intro-overline"><span className="tiny-diamond" /> INTERACTIVE DIGITAL INSTALLATION</div>
      <h1>GESTURE<span>//</span>SPACE</h1>
      <p className="intro-declaration">Your Hand Is The Interface</p>
      <div className="intro-rule" />
      <p className="intro-instruction">Move your hand.<br />Shape the digital world.</p>
    </div>
    <button className="enter-link" onClick={onEnter}><span>ENTER EXPERIENCE</span><span className="enter-arrow">↗</span></button>
    <div className="intro-footnote">CAMERA ACCESS REQUIRED <span>LOCAL EXPERIENCE / NO UPLOAD</span></div>
  </section>
}
