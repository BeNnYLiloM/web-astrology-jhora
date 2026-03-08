# Makaranda Research Notes

## Confirmed So Far

- `JHora` explicitly says `Sri Surya Siddhanta (SSS) - generalized Makaranda version` uses algorithms from Sri Vinay Jha.
- `JHora` also says traditional `beeja samskara` methods are relevant here and that the most ancient extant source is the `Makaranda Table`.
- This strongly suggests the target is a generalized computational tradition, not a fixed ephemeris lookup.

## Historical Beeja Clues

From older Indian astronomy references associated with the same family of traditions, beeja corrections are expressed as *small annual longitude corrections*, not large ad hoc epoch offsets.

Two historically cited variants are:

### Variant A
Epoch of zero correction near Saka 420/421 (499 AD)

- Moon: `-25/250` arcmin/year = `-0.1` arcmin/year
- Moon apogee: `-114/250` arcmin/year = `-0.456` arcmin/year
- Moon node: `-96/250` arcmin/year = `-0.384` arcmin/year
- Mars: `+48/250` arcmin/year = `+0.192` arcmin/year
- Mercury: `+420/250` arcmin/year = `+1.68` arcmin/year
- Jupiter: `-47/250` arcmin/year = `-0.188` arcmin/year
- Venus: `-153/250` arcmin/year = `-0.612` arcmin/year
- Saturn: `+20/250` arcmin/year = `+0.08` arcmin/year

### Variant B
Epoch of zero correction near Saka 444 (522 AD)

- Moon: `-25/235` arcmin/year = `-0.10638` arcmin/year
- Moon apogee: `-114/235` arcmin/year = `-0.48511` arcmin/year
- Moon node: `-96/235` arcmin/year = `-0.40851` arcmin/year
- Mars: `+45/235` arcmin/year = `+0.19149` arcmin/year
- Mercury: `+420/235` arcmin/year = `+1.78723` arcmin/year
- Jupiter: `-47/235` arcmin/year = `-0.2` arcmin/year
- Venus: `-153/235` arcmin/year = `-0.65106` arcmin/year
- Saturn: `+20/235` arcmin/year = `+0.08511` arcmin/year

## Why This Matters

Current values in `server/SuryaSiddhanta.js` are:

- Moon: `1131.1`
- Mars: `14.8`
- Mercury: `45.6`
- Jupiter: `-7.5`
- Venus: `-20`
- Saturn: `-55`
- Rahu: `3.6`
- MoonApogee: `75`

Those are currently stored as cycle adjustments per mahayuga. They need auditing because they look unlike the small annualized corrections found in source traditions.

## Working Hypothesis

The clean path is:

1. Reconstruct `beeja` in historically meaningful units.
2. Rebuild mean motions from those values.
3. Re-check mean Moon before touching `manda`.
4. Only after mean Moon aligns, revisit the lunar correction stage.

## Regression Findings With The Historical Lunar Layer

After replacing the previous ad hoc Moon layer with a historically scaled candidate:

- Most Moon reference cases moved into roughly `0'..8'` error.
- Remaining stubborn cases are concentrated in a smaller subset such as `Roman`, `Nadya2`, `Tanya`, `Ksyusha`.
- This means the biggest error was indeed in the base mean-lunar layer, not only in the final correction.

## What Was Tested Next

### 1. Naive second lunar correction

A straightforward implementation of the commonly cited second lunar correction form made the results much worse overall.

Current conclusion:

- the missing piece is probably **not** a naive bolt-on second correction using the usual modernized formula,
- or the classical rule is being applied at the wrong stage / with the wrong motion term.

### 2. Moon apogee layer search

A global search over plausible historical `MoonApogee` rate and epoch constants improved the aggregate result only slightly.

Current conclusion:

- the remaining residual is **not** explained by apogee constants alone.

### 3. Moon manda circumference search

Searching the Moon epicycle circumference globally gave a modest but real improvement.

Best experimental region so far:

- even quadrant circumference around `32.9`
- odd quadrant circumference around `31.9`

Current conclusion:

- the surviving error may be connected to the exact `manda` model used by generalized `Makaranda`,
- possibly including revised table-derived parameters rather than the plain textbook `32 / 31.67` pair.

### 4. Combined model-family search

Even when jointly varying:

- Moon apogee rate,
- Moon apogee offset,
- Moon even circumference,
- Moon odd circumference,

there are still stubborn outliers above the target tolerance.

Current conclusion:

- `JHora` is likely using at least one additional structural step not yet present in the project,
- not just a different set of 1-2 constants.

## Current Best Hypothesis

The remaining mismatch likely comes from one of these:

1. a more exact generalized `Makaranda` lunar `manda` procedure,
2. an additional classical correction stage applied in a non-naive way,
3. or a different epoch-level treatment feeding the Moon/apogee pair.

### 5. Revised manda experiment

Using the `Makaranda`-style revised manda idea from secondary literature:

- compute an initial `mandakendra`,
- derive a first `mandaphala`,
- revise the `mandakendra` by half that value,
- then derive a final full `mandaphala`.

Current conclusion:

- this changes the residual pattern in a meaningful way,
- but in the tested form it still does not beat the current best simple historical lunar layer.
- so it remains a plausible structural clue, but not yet the winning implementation.

### 6. Precise geometric manda experiment

Replacing the simple lunar correction with the more exact geometric `P/H` style formula was also tested.

Current conclusion:

- this does not improve the aggregate fit enough,
- so the missing `JHora` behavior is probably not just a switch from the simplified arc formula to the exact geometric one.

### 7. Rational lunar manda formula

A classical Surya Siddhanta style rational Moon formula was tested in the form:

- reduce the lunar anomaly to its quadrant `bhuja`,
- set `y = bhuja / 6`,
- set `x = (30 - y) * y`,
- compute `mandaphala = x / (56 - x / 20)`.

Current conclusion:

- this performs surprisingly well and is historically meaningful,
- but by itself it still does not resolve the worst `JHora` outliers.

### 8. Fixed-maximum tabular manda family

Based on source descriptions of a lunar manda table with maximum about `5° 2' 10"`, two variants were tested:

- a continuous fixed-maximum sine form,
- a 3-degree tabular interpolation form.

Current conclusion:

- both behave very similarly,
- both are competitive with the current best historical Moon layer,
- but neither removes the worst remaining outliers.

### 9. Bhujantara from Sun manda / 27

A classical small bhujantara correction based on signed Sun manda divided by `27` was also tested.

Current conclusion:

- this does not improve the aggregate fit in the current model,
- so if `JHora` uses a bhujantara-like step, it is likely not in this simplest form or not at this stage.

### 10. Local Chapter I PDF findings

The local file `Surya Siddhanta, Chapter I, with Commentary and Calculations.pdf` was extracted into text for inspection.

What it confirms clearly:

- `Moon revolutions per Mahayuga = 57,753,336`
- `Moon apsis revolutions per Mahayuga = 488,203`
- `Moon declination node revolutions per Mahayuga = 232,238`
- at the end of `Krita Yuga`, the Moon's apsis is stated to be at the beginning of `Capricorn`
- the Moon's declination node is stated to be at the beginning of `Libra`

Why this matters:

- it confirms the project is broadly using the right classical family of constants for the Moon and lunar apsis,
- but Chapter I does **not** provide the missing lunar correction procedure itself.

Additional practical finding:

- some raw planetary revolution counts in the code differ from the plain Chapter I values, especially `Mars` and `Venus`.
- however, replacing those directly with the Chapter I counts does not improve the current reference fit, which suggests the current generalized `Makaranda` layer is not a plain Chapter I implementation.

Current conclusion:

- Chapter I is useful for validating the base constant family and epoch clues,
- but it is not enough by itself to recover the missing `JHora` lunar procedure.

### 11. Chapter I epoch transfer test

Using the Chapter I statement literally:

- all mean planets at the end of `Krita Yuga` are at the beginning of `Aries`,
- the Moon's apsis is at the beginning of `Capricorn`.

A direct transfer of that epoch into the current `Kali`-based code was tested.

Current conclusion:

- the result is catastrophically wrong for the reference Moon cases,
- so the working generalized `Makaranda` layer in `JHora` is clearly **not** just a direct Chapter I epoch shift plugged into a `Kali` origin.

This is important because it narrows the reconstruction problem:

- the missing behavior is not simply a forgotten classical start position,
- it must involve a different abridged epoch treatment, generalized correction layer, or later-table procedure.

### 12. jyotisha.net reference

The article at `jyotisha.net` on `Surya-Siddhanta` is useful mainly as a consistency check for the broad classical model.

What it helps confirm:

- the geocentric interpretation is intentional and computationally practical,
- `Moon = 57,753,336` revolutions per Mahayuga,
- `Rahu = -232,238`,
- `Mars = 2,296,832`,
- `Venus = 7,022,376`,
- the text is reading the standard Surya-Siddhanta cycle model in a way that agrees well with modern periods.

What it does **not** provide:

- no explicit lunar `manda` algorithm,
- no `Makaranda`-specific Moon correction procedure,
- no generalized `JHora`-style treatment of the lunar apsis or tabular correction layer.

Current conclusion:

- this source supports the base constant family,
- but it does not resolve the missing Moon procedure we still need for `Sri Surya Siddhanta (Makaranda)`.

### 13. Reverse-engineering the missing Moon term

A direct black-box analysis was run against the current Moon result and the `JHora` reference Moon values.

Main finding:

- the missing residual is **not** explained well by lunar anomaly alone,
- but it becomes much more explainable once Sun-related terms are added.

A simple anomaly-only Fourier fit stayed around:

- `RMSE ~ 8.2'`

A mixed anomaly + Sun-layer fit dropped to about:

- `RMSE ~ 4.0'`

Interpretation:

- the missing behavior is very likely a **second lunar correction of solar type**, not just a different Moon apogee constant.

### 14. Classical harmonic test

The Moon residual was then projected onto more interpretable classical harmonic terms:

- `sin(D)` and `sin(2D)` where `D = Moon - Sun`,
- `sin(2D - M)` with `M = lunar anomaly`,
- `sin(Ms)` with `Ms = solar anomaly`,
- optionally `sin(M)`.

Current findings:

- `D`-only terms already explain the residual better than anomaly-only fits,
- a small classical harmonic family such as
  - `sin(2D - M)`
  - `sin(2D)`
  - `sin(Ms)`
  gives a much better fit,
- adding `sin(M)` improves the fit further.

This is an important structural clue:

- the missing `JHora` Moon behavior now looks much more like a **secondary lunar anomaly / evection-like correction layer**,
- not like a simple offset, a plain epoch shift, or just a different one-step manda curve.

Practical implication:

- the next recovery step should focus on reconstructing an Indian/Surya-Siddhanta style second lunar correction in terms of elongation and solar anomaly,
- then checking whether `Makaranda` modifies that classical layer or tabulates it differently.

### 15. Source-grounded second-equation tests

Historically grounded Moon models were tested directly against the current `JHora` residual:

- `Manjula`-type second equation,
- `Bhaskara`-type variation term,
- combinations of those terms,
- and a rough `Shripati`-style reconstruction.

What happened:

- the **full historical amplitudes** over-correct very badly when applied directly on top of the current Moon model,
- the rough `Shripati` reconstruction is dramatically too large,
- but the residual still projects meaningfully onto the same classical families when those terms are treated as basis functions.

Important interpretation:

- the present Moon base in the project is already absorbing a large part of the classical correction structure,
- the remaining difference to `JHora` looks like a **small residual version** of classical second-lunar-equation terms,
- not like an entirely unrelated correction.

This narrows the next step further:

- we should search for how generalized `Makaranda` re-normalizes or abridges the classical second lunar equation,
- rather than applying the raw historical amplitudes unchanged.

### 16. Generalized residual layer with mean-offset term

A refined search was run over a small generalized residual family on top of the current historical Moon base:

- constant term `k0` in arcminutes,
- `sin(2D - M)`,
- `sin(2D)`,
- `sin(Ms)`,
- `sin(M)`.

This matters because the unconstrained harmonic fit consistently wanted a small non-zero intercept of about `2'..3'`, which is not a case-by-case hack but a possible clue that the residual model still contains:

- a tiny remaining mean-Moon epoch offset,
- plus a small generalized second-lunar-equation layer.

Best practical findings so far:

- with the intercept included, a classical four-term fit reaches about `RMSE = 3.90'`, `maxAbs = 5.90'`;
- a bounded grid search focused on lower worst-case error found a candidate around:
  - `k0 = 1.5'`
  - `sin(2D - M) * -2.25'`
  - `sin(2D) * 3.25'`
  - `sin(Ms) * 11.5'`
  - `sin(M) * 3.75'`
- that candidate gives about `RMSE = 4.05'`, `maxAbs = 5.54'`.

Interpretation:

- the residual Moon behavior is now tightly localized;
- the missing `JHora generalized Makaranda` layer appears to be very small in amplitude;
- it looks like a combination of:
  - a tiny global mean-offset correction,
  - and a reduced solar-type second lunar equation.

This is the closest the project has come so far to the user target without per-reference hardcoding.

Practical implication:

- the next step should be to justify this residual family from source material, not blindly ship it as production math;
- especially the constant term should be tested against the Moon epoch / mean-longitude layer, because it may indicate that the `moonOffset` constant is still a few arcminutes away from the generalized `Makaranda` value used by `JHora`.

### 17. Moon mean-offset search

A direct test was run to check whether the small intercept `k0` from the generalized residual layer can be reinterpreted as a correction to the underlying `Moon` mean offset.

Method:

- shift the base Moon longitude by a small amount from `0'` to `3'`,
- then refit the four residual harmonic terms **without** a separate intercept:
  - `sin(2D - M)`
  - `sin(2D)`
  - `sin(Ms)`
  - `sin(M)`

Best result found:

- `Moon offset shift = +2.25'`
- fitted residual weights approximately:
  - `sin(2D - M) * -2.84'`
  - `sin(2D) * 3.71'`
  - `sin(Ms) * 10.92'`
  - `sin(M) * 3.53'`
- resulting fit:
  - `RMSE = 3.90'`
  - `maxAbs = 5.89'`

Interpretation:

- the previous intercept term is almost perfectly explained by a small increase in the base `moonOffset` constant;
- this strongly suggests the residual model is not asking for an arbitrary extra constant, but for:
  - a slightly improved mean-Moon epoch constant,
  - plus a small generalized solar-type second-lunar correction layer.

Practical implication:

- if the project later moves from pure research into a production correction candidate, the constant part should almost certainly be absorbed into `HISTORICAL_MAKARANDA_LUNAR_LAYER.moonOffset`,
- not left as an external empirical add-on.

### 18. Post-offset apogee-term check

After absorbing the small constant residual into a `Moon` mean-offset shift of about `+2.25'`, an additional `Manjula`-style apogee term was tested together with the four main harmonic residual terms.

Observed result:

- the numerical fit improved only slightly in `RMSE`,
- but it required very large and unstable weights on the `Manjula` and `sin(M)` style terms,
- and worst-case error did **not** improve enough to justify treating that apogee term as the missing clean source-based correction.

Interpretation:

- once the constant residual is absorbed into `moonOffset`, the remaining error is still explained better by a compact reduced second-lunar-equation family than by simply adding a raw apogee-style `Manjula` term,
- so the next source-recovery step should stay focused on the generalized solar-type second lunar correction layer rather than on direct apsis coupling alone.

### 19. Mean-based Munjala check

A more source-faithful `Munjala` test was run using **mean** quantities, following the form reported by Duke for the second lunar anomaly:

- let `eta = meanSun - moonApogee`,
- let `psi = meanMoon - meanSun`,
- then the source-grounded second term is proportional to `-cos(eta) * sin(psi)`.

This is important because earlier source-grounded tests were too rough and mixed true and mean layers.

Two constrained models were checked after absorbing `+2.25'` into the Moon mean offset:

- `Munjala + solar anomaly`
- `Munjala + sin(2D) + solar anomaly`

Result:

- both remained clearly weaker than the unconstrained four-term harmonic residual model,
- the best constrained `Munjala` family stayed around `RMSE ~ 4.7'` and `maxAbs ~ 10.7'`.

Important structural insight:

- the recovered best-fit residual still does **not** collapse to plain `Munjala`,
- but it also does not contradict it;
- in fact, the `Munjala` term is closely related to the pair of harmonics already appearing in the best empirical family.

Using the identities:

- `M = eta + psi`
- `2D - M = psi - eta`
- `cos(eta) sin(psi) = (sin(M) + sin(2D - M)) / 2`

So the source-based `Munjala` term naturally links to two of the strongest recovered harmonics:

- `sin(M)`
- `sin(2D - M)`

Interpretation:

- the current best residual layer looks less like a random fit and more like a **generalized / reweighted extension** of the classical second lunar anomaly family,
- rather than a direct raw `Munjala` term copied unchanged.

### 20. Generalized Munjala family

A more structured recovery test was run after absorbing `+2.25'` into the base Moon mean offset.

Instead of using a fully free four-harmonic family only, a **generalized Munjala** family was tested:

- keep the source-grounded mean-based `Munjala` term,
- add the elongation term `sin(2D)`,
- add solar anomaly `sin(Ms)`,
- add an independent lunar term `sin(M)`.

This is motivated by the identity:

- `-cos(eta) * sin(psi) = -(sin(M) + sin(2D - M)) / 2`

so a generalized model can preserve the classical source structure while still allowing the project/JHora residual to reweight the lunar part.

Result:

- the `generalized_munjala` model reached about:
  - `RMSE = 3.86'`
  - `maxAbs = 5.78'`
- this is nearly as good as the best unconstrained harmonic core,
- and clearly better than plain constrained `Munjala` tests.

Important interpretation:

- the best residual layer now looks very plausibly like a **generalized/reweighted Munjala family**,
- not a raw copied historical second equation,
- and not a random collection of unrelated harmonics.

A further model with both generalized `Munjala` and a free evection term improved aggregate RMSE slightly, but at the cost of unstable large coefficients and no cleaner worst-case behavior.

So the current best structured reading is:

- adjust the Moon mean offset by a few arcminutes,
- then apply a small generalized second-lunar-equation layer that is source-compatible with `Munjala`,
- but not identical to the raw classical amplitude pattern.

### 21. End-to-end generalized Munjala candidates

To move from residual fitting toward a usable Moon candidate, two explicit end-to-end generalized `Munjala` candidates were preserved:

1. `least_squares_generalized_munjala`
2. `coverage_13_of_14_generalized_munjala`

Both use:

- `Moon mean offset + 2.25'`
- a generalized source-compatible second-lunar layer based on:
  - mean-based `Munjala`
  - `sin(2D)`
  - `sin(Ms)`
  - `sin(M)`

Tradeoff observed:

- the least-squares candidate keeps better overall balance:
  - about `RMSE = 3.86'`
  - `maxAbs = 5.78'`
- the coverage-oriented candidate pushes `13/14` reference Moon cases into the `<= 5'` band,
  - but leaves one stubborn outlier (`Roman`) around `6.5'`.

Interpretation:

- this is now a very strong indication that the remaining mismatch is narrow and structured,
- likely a missing higher-order or differently normalized term in one part of the lunar anomaly space,
- not a wholesale failure of the reconstructed Moon model.

Practical implication:

- before editing production Moon math directly, the safest next move is to keep comparing these two structured candidates against any new JHora reference charts,
- especially charts near the same anomaly/elongation region as `Roman`, because that region is now the clearest diagnostic window into the remaining missing term.

### 22. Single missing-term probe

To test whether one narrow higher-order harmonic could explain the remaining outlier region, a structured probe was run on top of the current `least_squares_generalized_munjala` model.

Method:

- keep the current structured generalized `Munjala` candidate fixed,
- treat the remaining residual as the target,
- test one additional small harmonic at a time from a plausible lunar family.

Most useful result:

- the strongest single extra term was `sin(2D + M)`,
- with a fitted small correction of roughly `-3.10' * sin(2D + M)` plus a tiny intercept.

When applied end-to-end on top of the generalized `Munjala` candidate, the result became approximately:

- `RMSE = 3.01'`
- `maxAbs = 5.61'`
- `13/14` Moon reference cases within `5'`

Important interpretation:

- this is a strong sign that the remaining mismatch may indeed be just **one small higher-order lunar term** in the stubborn anomaly region,
- not a broken core model.

Important caution:

- this extra term is currently a diagnostic candidate, not a source-proven production formula;
- it should therefore remain in the research layer until it can be tied to a classical or generalized siddhantic interpretation.

### 23. Interpreting the extra `sin(2D + M)` term

The strongest single extra residual term found on top of the structured generalized `Munjala` model was:

- `-3.10' * sin(2D + M)`

This is important because it does **not** look arbitrary when compared with standard lunar theory.

Modern lunar-theory summaries list among the next-order longitude terms a contribution of the form:

- `+192" * sin(M + 2D)`

which is about:

- `+3.20' * sin(M + 2D)`

The recovered project/JHora diagnostic term is therefore very close in magnitude:

- recovered: about `3.10'`
- modern tabulated size: about `3.20'`

The sign difference may be due to:

- different sign conventions for anomaly / elongation,
- measuring anomaly from apogee rather than perigee,
- or the way the residual was added on top of an already corrected Moon.

Interpretation:

- the remaining residual is very plausibly **not random overfitting**,
- it may correspond to a genuine known higher-order lunar inequality of the `M + 2D` type,
- i.e. a small next-order solar-lunar coupling term that the current reconstructed `Makaranda` layer is still missing.

This does **not** prove that JHora explicitly uses a modern-form `M + 2D` term,
but it strongly suggests the last gap is in a physically/astronomically meaningful place.

Practical implication:

- the next best research step is to look for whether generalized `Makaranda` or Vinay Jha's algorithm effectively reproduces this term indirectly,
- rather than treating it as a mere free statistical add-on.

### 24. Two-term higher-order lunar family

A source-guided two-term extension was tested on top of the structured generalized `Munjala` model.

Terms used:

- `sin(M + 2D)`
- `sin(M + Ms)`

These are both known forms from ordinary lunar-theory higher-order longitude terms, so they are more meaningful than adding an arbitrary extra harmonic.

Best independent two-term fit gave approximately:

- intercept `+0.60'`
- `-2.80' * sin(M + 2D)`
- `-0.85' * sin(M + Ms)`
- result:
  - `RMSE = 2.96'`
  - `maxAbs = 5.43'`
  - `13/14` Moon reference cases within `5'`

This is the strongest structured candidate so far.

A stricter one-parameter version that preserved the modern-amplitude ratio between the two terms performed substantially worse, so the generalized `Makaranda` residual does not appear to follow the modern ratio unchanged.

Interpretation:

- the residual still looks physically meaningful,
- but its weighting differs from simple modern lunar-theory scaling,
- which is consistent with the broader picture that `JHora generalized Makaranda` behaves like a **generalized/reweighted siddhantic lunar model**, not like a direct import of modern lunar theory.
