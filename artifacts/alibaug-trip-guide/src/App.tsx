function Home() {
  const { saved, setLocation, notify } = useGuide();
  const [, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(
      () => setClock(Date.now()),
      60000
    );
    return () => window.clearInterval(timer);
  }, []);

  const countDown = Math.max(
    0,
    Math.ceil(
      (new Date('2026-11-27T00:00:00').getTime() -
        Date.now()) /
        86400000
    )
  );

  const now = () => {
    const today = new Date();
    const date = today.toDateString();

    const tripDates = [
      'Fri Nov 27 2026',
      'Sat Nov 28 2026',
      'Sun Nov 29 2026',
      'Mon Nov 30 2026',
    ];

    const dayIndex = tripDates.indexOf(date);

    if (dayIndex < 0) {
      notify(
        'Not a travel day yet — Day 1 is ready whenever you are.'
      );
      setLocation('/days/1');
      return;
    }

    const d = days[dayIndex];
    const mins = today.getHours() * 60 + today.getMinutes();

    const match = d.stops.find((s) => {
      const time = s.time.match(
        /(\d{1,2}):(\d{2})\s*(AM|PM)/i
      );

      if (!time) return false;

      let hr = Number(time[1]) % 12;

      if (time[3].toUpperCase() === 'PM') {
        hr += 12;
      }

      const start = hr * 60 + Number(time[2]);

      return mins >= start && mins < start + 90;
    });

    const target = match?.id || d.stops[0].id;

    setLocation(`/days/${d.id}?stop=${target}`);

    window.setTimeout(() => {
      document
        .getElementById(target)
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
    }, 350);
  };

  return (
    <>
      {/* Hero section */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            JUST US, THE COAST, AND THE LONG WAY AROUND
          </div>

          <h1>
            Alibaug,
            <br />
            <span>here we come.</span>
          </h1>

          <p className="muted">
            Four days of beach stops, ferry rides, sunset views,
            and little detours. Our own pocket guide to the places
            we'll discover, the roads we'll take, and the memories
            we'll bring back.
          </p>

          <div className="hero-meta">
            <span className="pill">27–30 Nov 2026</span>
            <span className="pill">2 travellers</span>
            <span className="pill">Blue Waves · Varsoli</span>
          </div>

          <div className="actions">
            <Link
              href="/days/1"
              className="btn primary"
              data-testid="start-day-one"
            >
              Let's get going <span aria-hidden="true">→</span>
            </Link>

            <button
              className="btn soft"
              onClick={now}
              data-testid="button-whats-now"
            >
              <img
                src={characterAssets.looking}
                alt=""
                width="29"
                height="25"
                style={{
                  objectFit: 'cover',
                  borderRadius: 8,
                  mixBlendMode: 'multiply',
                }}
              />
              What's on now?
            </button>
          </div>
        </div>

        <img
          className="hero-art"
          src={characterAssets.lessgoo}
          alt="A couple riding their green scooty, sharing a peace sign"
          data-testid="img-hero-couple"
        />
      </section>

      {/* Countdown section */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Your little countdown</div>
            <h2>
              {countDown === 0
                ? 'The coast is calling.'
                : `${countDown} days to sea air.`}
            </h2>
          </div>

          <Link className="btn soft" href="/prep">
            Get trip-ready →
          </Link>
        </div>

        <p className="muted">
          Fares and schedules are estimates. Confirm before travel.
        </p>
      </section>

      {/* Itinerary cards */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Pick a page</div>
            <h2>Four days, your pace.</h2>
          </div>

          <Link href="/days/1" className="muted">
            See all days →
          </Link>
        </div>

        <div className="grid-days">
          {days.map((d) => {
            const done = d.stops.filter((s) =>
              saved.done.includes(s.id)
            ).length;

            return (
              <Link
                href={`/days/${d.id}`}
                key={d.id}
                className="day-card"
                data-testid={`card-day-${d.id}`}
              >
                <div
                  className="day-no"
                  style={{ background: d.color }}
                >
                  0{d.id}
                </div>

                <h3>{d.date}</h3>
                <p>{d.title}</p>

                <p style={{ marginTop: 10 }}>
                  {done}/{d.stops.length} stops stamped
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Explore places */}
      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">
              Where shall we wander?
            </div>
            <h2>Jump to a place</h2>
          </div>

          <Link href="/map" className="btn soft">
            Open map →
          </Link>
        </div>

        <div className="jumpbox">
          {places.map((p) => (
            <Link
              key={p.id}
              href={`/place/${p.id}`}
              className="jump-chip"
              data-testid={`place-chip-${p.id}`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Road trip note */}
      <div className="card">
        <div className="eyebrow">
          THE PLAN? GO WITH THE FLOW.
        </div>

        <h3>
          Chase the view. Don't miss the last ride.
        </h3>

        <p className="muted">
          Some stops might take longer, some detours might be worth
          it, and the best moments probably won't be on the itinerary.
          Let's leave room for all of that, while keeping an eye on
          the tides, ferry timings, and daylight.
        </p>

        <div className="actions">
          <Link className="btn primary" href="/prep">
            Get trip-ready →
          </Link>

          <Link className="btn soft" href="/journey">
            See our journey →
          </Link>
        </div>
      </div>
    </>
  );
}

function SandFooter() {
  const countdown = Math.max(
    0,
    Math.ceil(
      (new Date('2026-11-27T00:00:00').getTime() -
        Date.now()) /
        86400000
    )
  );

  return (
    <footer className="sand-footer">
      <div className="footer-inner">
        <div>
          <div className="eyebrow">BEFORE WE HEAD OUT</div>

          <h2>
            Everything checked? Then it's just us and the coast.
          </h2>

          <p>
            27–30 November 2026 · {countdown} days until we ride out.
          </p>

          <small
            style={{
              display: 'block',
              marginTop: 18,
            }}
          >
            Bus tickets, ferry and boat timings, tide tables, scooty
            rental, and resort check-in. One last check, bags packed,
            and off we go. Four days, two of us, and a little stretch
            of coast to explore.
          </small>
        </div>

        <img
          src={characterAssets.kiss}
          alt="The couple sharing a sweet moment on their green scooty"
          className="footer-character"
        />
      </div>
    </footer>
  );
}
