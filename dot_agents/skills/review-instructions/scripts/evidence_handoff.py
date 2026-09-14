import argparse
import hashlib
import json
from pathlib import Path
import sys


def text(record, key):
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} must be a nonempty string")

    return value


def artifact(record, key, root):
    path = (root / text(record, key)).resolve()
    if not path.is_file() or not path.read_bytes().strip():
        raise ValueError(f"{key} needs a nonempty evidence file: {path}")

    return path


def frozen(record, key, root):
    entry = record.get(key)
    if not isinstance(entry, dict):
        raise ValueError(f"{key} needs path and sha256")

    path = artifact(entry, "path", root)
    if hashlib.sha256(path.read_bytes()).hexdigest() != text(entry, "sha256"):
        raise ValueError(f"{key} differs from its recorded sha256")

    return path


def handoff(manifest_path, current):
    manifest = json.loads(manifest_path.read_text())
    if not isinstance(manifest, dict):
        raise ValueError("manifest must be a JSON object")

    root = manifest_path.parent
    kind = text(manifest, "kind")
    if kind not in ("repair", "convention"):
        raise ValueError("kind must be repair or convention")

    request = artifact(manifest, "request", root)
    criteria = frozen(manifest, "criteria", root)
    failure = artifact(manifest, "original_failure", root) if kind == "repair" else None
    baseline = frozen(manifest, "baseline", root)
    candidate = frozen(manifest, "candidate", root)
    if current.read_bytes() != candidate.read_bytes():
        raise ValueError("current instructions differ from the tested candidate")

    targets = manifest.get("targets")
    if (not isinstance(targets, list) or not targets
            or any(not isinstance(target, str) or not target.strip() for target in targets)
            or len(set(targets)) != len(targets)):
        raise ValueError("targets must list distinct nonempty model identifiers")

    runs = manifest.get("runs")
    if not isinstance(runs, list) or not runs:
        raise ValueError("runs must contain recorded comparisons")

    observed = set()
    evidence = []
    for run in runs:
        if not isinstance(run, dict):
            raise ValueError("each run must be a JSON object")

        target = text(run, "target")
        if target not in targets:
            raise ValueError(f"run target is not in targets: {target}")

        harness = text(run, "harness")
        delivered = artifact(run, "input", root)
        old_output = artifact(run, "baseline_output", root)
        new_output = artifact(run, "candidate_output", root)
        observed.add(target)
        evidence.append(f"For {target} under {harness}, inspect recorded inputs at {delivered}, "
                        f"raw baseline output at {old_output}, and raw candidate output at {new_output}.")

    missing = set(targets) - observed
    if missing:
        raise ValueError(f"missing comparisons for {', '.join(sorted(missing))}")

    original = f"Read the original rejected reply or failure at {failure}."
    if kind == "convention":
        original = "This is a new convention, so no original failure is required."

    standard = Path(__file__).resolve().parents[1] / "SKILL.md"
    return "\n".join([
        "Review this instruction change without editing files or running mutating commands. "
        "Form your own assessment.",
        f"Apply the instruction-review standard at {standard}.",
        f"The instruction under review is {current}. The evidence manifest is {manifest_path}.",
        f"Read the request at {request} and the fixed pass criteria at {criteria}.",
        original,
        f"Compare the exact baseline at {baseline} with the tested candidate at {candidate}.",
        *evidence,
        "File completeness does not establish a behavioral pass. Verify what reached each model, "
        "the preserved failure conditions and unchanged criteria, and judge each first output "
        "without corrections. Record pass, fail, or unverified for every criterion with its evidence. "
        "Missing, mixed, or failing evidence leaves the change unproved.",
    ])


def main():
    parser = argparse.ArgumentParser(description="Validate an evidence manifest and emit its review handoff.")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("current", type=Path)
    args = parser.parse_args()
    try:
        result = handoff(args.manifest.resolve(), args.current.resolve())
    except (OSError, ValueError) as error:
        print(f"Unverified: {error}", file=sys.stderr)
        return 1

    print(result)
    return 0


if __name__ == "__main__":
    sys.exit(main())
