import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts/evidence_handoff.py"


class EvidenceHandoffTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name).resolve()
        for name in ("request", "failure", "criteria", "old", "candidate", "input", "old-output", "new-output"):
            (self.root / name).write_text(name + "\n")
        (self.root / "current").write_bytes((self.root / "candidate").read_bytes())
        self.manifest = {
            "kind": "repair",
            "request": "request",
            "original_failure": "failure",
            "criteria": {"path": "criteria", "sha256": self.digest("criteria")},
            "baseline": {"path": "old", "sha256": self.digest("old")},
            "candidate": {"path": "candidate", "sha256": self.digest("candidate")},
            "targets": ["model-a"],
            "runs": [{"target": "model-a", "harness": "recorded harness", "input": "input",
                      "baseline_output": "old-output", "candidate_output": "new-output"}],
        }

    def digest(self, name):
        return hashlib.sha256((self.root / name).read_bytes()).hexdigest()

    def run_handoff(self):
        path = self.root / "evidence.json"
        path.write_text(json.dumps(self.manifest))

        return subprocess.run(["python3", str(SCRIPT), str(path), str(self.root / "current")],
                              text=True, capture_output=True)

    def test_emits_the_required_repair_evidence_without_claiming_a_pass(self):
        result = self.run_handoff()

        self.assertEqual(result.returncode, 0, result.stderr)
        required = ("request", "failure", "criteria", "old", "candidate", "current", "input",
                    "old-output", "new-output", "evidence.json")
        words = {word.rstrip(".,") for word in result.stdout.split()}
        self.assertEqual({name for name in required if str(self.root / name) not in words}, set())
        self.assertIn("does not establish a behavioral pass", result.stdout)

    def test_accepts_an_explicit_new_convention_without_an_original_failure(self):
        self.manifest["kind"] = "convention"
        del self.manifest["original_failure"]

        result = self.run_handoff()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("new convention", result.stdout)

    def test_rejects_a_repair_without_its_original_failure(self):
        del self.manifest["original_failure"]

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("original_failure", result.stderr)
        self.assertEqual(result.stdout, "")

    def test_rejects_outputs_missing_for_a_named_target(self):
        self.manifest["targets"].append("model-b")

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("model-b", result.stderr)

    def test_rejects_an_untested_candidate_edit(self):
        (self.root / "candidate").write_text("different instructions\n")

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("candidate", result.stderr)

    def test_rejects_current_instructions_changed_after_the_trial(self):
        (self.root / "current").write_text("an untested revision\n")

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("current instructions", result.stderr)

    def test_rejects_criteria_changed_after_the_trial(self):
        (self.root / "criteria").write_text("relaxed acceptance\n")

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("criteria", result.stderr)

    def test_rejects_an_empty_recorded_input(self):
        (self.root / "input").write_text("")

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("input", result.stderr)

    def test_rejects_a_missing_raw_output(self):
        (self.root / "old-output").unlink()

        result = self.run_handoff()

        self.assertEqual(result.returncode, 1)
        self.assertIn("baseline_output", result.stderr)


if __name__ == "__main__":
    unittest.main()
