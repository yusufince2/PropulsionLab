# PropulsionLab

A rocket delta-v calculator and mission-readiness dashboard, built to
explore the physics behind orbital launch vehicles.

**[Live demo →](#)** *(link added once deployed — see Deployment below)*

![PropulsionLab dashboard](https://via.placeholder.com/600x400?text=Add+a+screenshot+here)

## What it does

Enter a rocket's wet mass, dry mass, exhaust velocity, and burn time,
and PropulsionLab:

- Calculates the total delta-v (Δv) the rocket can achieve using the
  Tsiolkovsky rocket equation
- Displays it as a ring gauge scored against a selectable mission
  target — Low Earth Orbit, Geostationary Transfer, Lunar Transfer,
  or Mars Transfer
- Plots how delta-v accumulates over the course of the burn
- Includes presets with real published specs for Falcon 9, Saturn V,
  Starship Super Heavy, and Atlas V, so you can compare real rockets
  against each other and against different mission targets

## The physics

The core of this project is the **Tsiolkovsky rocket equation**:

```
Δv = ve · ln(m0 / mf)
```

Where:
- `Δv` — total change in velocity the rocket can achieve
- `ve` — exhaust velocity (how fast propellant leaves the engine)
- `m0` — initial (wet) mass: rocket + fuel
- `mf` — final (dry) mass: rocket after fuel is spent
- `ln` — natural logarithm

This is the single most important equation in rocketry — it's the
reason multi-stage rockets exist at all. Because the relationship is
logarithmic, there are steep diminishing returns to just adding more
fuel to a single stage: at some point the extra fuel mass costs more
in inert tank structure than it gives back in Δv. Dropping empty
stages (as Saturn V or Falcon 9's real staging does) resets that
mass ratio and is far more effective than trying to build one giant
single-stage rocket.

### Burn curve

The chart doesn't just show the final Δv — it shows Δv accumulating
second by second across the burn. This assumes fuel burns off at a
**constant mass flow rate**, so at any time `t`, the current mass is
linearly interpolated between wet and dry mass, and Δv is recomputed
at that instant. The resulting curve is not a straight line: it gets
steeper toward the end of the burn, because the same amount of fuel
burned has a larger effect on velocity once the rocket is lighter.

### Mission targets

The ring gauge scores a rocket's Δv against approximate real-world
Δv budgets (from Earth's surface, including gravity and drag losses,
which the idealized rocket equation itself does not model):

| Target | Approx. Δv required |
|---|---|
| Low Earth Orbit | ~9,400 m/s |
| Geostationary Transfer | ~11,700 m/s |
| Lunar Transfer | ~12,500 m/s |
| Mars Transfer | ~13,000 m/s |

## Known limitations / simplifying assumptions

This tool is meant to build intuition, not to be flight-accurate.
Specifically, it does **not** account for:

- **Gravity losses** — the fact that a rocket spends part of its
  thrust just fighting gravity while still low in the atmosphere
- **Aerodynamic drag** — resistance from the atmosphere during ascent
- **Continuous thrust/mass coupling** — real thrust and acceleration
  change instant-to-instant as mass drops, rather than following a
  simplified constant-burn-rate model
- **Multi-stage effects** — currently models a single stage only,
  even though every rocket in the preset list is a real multi-stage
  vehicle

This is why the calculator's output for something like Falcon 9's
first stage (theoretical ~8,900+ m/s) is noticeably higher than the
real, actual delta-v Falcon 9's first stage contributes in practice
(~3,000-3,400 m/s) — the difference is exactly the gravity and drag
losses this idealized model leaves out.

## Data sources

Rocket preset specs (wet mass, dry mass, burn time) and specific
impulse figures are drawn from publicly published sources including
Wikipedia, SpaceX and NASA technical documentation, and the Space
Launch Report data sheets. Exhaust velocity is derived from each
engine's sea-level specific impulse using `ve = Isp × 9.81`.

## Built with

Plain HTML, CSS, and JavaScript — no frameworks, no build step,
no dependencies. The chart is drawn directly on an HTML `<canvas>`
element rather than using a charting library, so every pixel on
screen is something I wrote and can explain.

## Possible next steps

- Multi-stage support — sum Δv across stages, matching how real
  rockets actually fly
- A gravity-loss approximation to bring the theoretical Δv closer
  to real-world achieved Δv
- Payload mass as an input, to see how Δv budget shrinks as you
  carry more cargo

## Why I built this

I got interested in aerospace engineering after starting out
wanting to study computer science, and this project is where those
two interests meet — using code to actually model the mechanics of
how rockets reach orbit, rather than treating it as a black box.

## Run it locally

No build step required — just open `index.html` in a browser, or
serve the folder with any static file server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
