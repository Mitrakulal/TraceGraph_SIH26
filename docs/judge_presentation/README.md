# TraceGraph AI Judge Presentation Materials

This folder contains the presentation source content and delivery script for the TraceGraph AI SIH26146 judge presentation.

| File | Purpose |
|---|---|
| `TraceGraph_AI_Judge_Deck_Content.md` | The definitive ten-slide narrative, slide content, design direction, and speaker notes. Use this when revising or recreating the slide deck. |
| `TraceGraph_AI_Judge_Talking_Points.md` | Exact responses to difficult judge questions about synthetic data, model validity, metrics, explainability, safety, and the live demo. |
| `html/` | The ten editable, portable HTML slide sources. Open `html/title.html` first and advance through the named slide files in presentation order. |
| `assets/` | Local visual assets referenced by the HTML slides through repository-relative paths. |

The materials deliberately describe the **actual current model**: a CPU-trained Isolation Forest plus XGBoost pipeline on the controlled synthetic fixture. They distinguish synthetic benchmark metrics from real-world deployment claims and keep the human reviewer in control.

> Never describe the system as identifying a real person, wallet owner, criminal, or real-world risk. Use “synthetic anomaly,” “review priority,” and “human review required.”

## Editing and Reproducing the Deck

The source uses the standard 1280×720 slide canvas. Each file is self-contained and can be opened locally in a browser. The rendering service delivered the presentation from these sources; the repository copies are provided so the team can inspect and edit the deck without depending on workspace-only paths.
