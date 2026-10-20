import unittest

from pydantic import ValidationError

from api.models import SegmentationRequest
from api.segmentation import compute_segmentation


def sample_customers() -> list[dict]:
    return [
        {"id": "C001", "nombre": "Ana", "gastoAcumulado": 1800, "visitas6Meses": 12, "antiguedadMeses": 24},
        {"id": "C002", "nombre": "Luis", "gastoAcumulado": 2200, "visitas6Meses": 15, "antiguedadMeses": 30},
        {"id": "C003", "nombre": "Marta", "gastoAcumulado": 1600, "visitas6Meses": 10, "antiguedadMeses": 18},
        {"id": "C004", "nombre": "José", "gastoAcumulado": 180, "visitas6Meses": 2, "antiguedadMeses": 3},
        {"id": "C005", "nombre": "Rosa", "gastoAcumulado": 250, "visitas6Meses": 3, "antiguedadMeses": 5},
        {"id": "C006", "nombre": "Pedro", "gastoAcumulado": 120, "visitas6Meses": 1, "antiguedadMeses": 2},
    ]


class SegmentationTests(unittest.TestCase):
    def test_returns_assignments_groups_and_standardized_values(self) -> None:
        request = SegmentationRequest(k=2, customers=sample_customers())

        result = compute_segmentation(request)

        self.assertEqual(len(result["labels"]), 6)
        self.assertEqual(len(result["groups"]), 2)
        self.assertEqual(sum(group["cantidad"] for group in result["groups"]), 6)
        self.assertTrue(all(len(point["values"]) == 3 for point in result["standardizedFeatures"]))
        self.assertTrue(all(group["standardizedCentroid"] for group in result["groups"]))
        self.assertGreaterEqual(result["inertia"], 0)

    def test_results_are_reproducible(self) -> None:
        request = SegmentationRequest(k=2, customers=sample_customers())

        first = compute_segmentation(request)
        second = compute_segmentation(request)

        self.assertEqual(first["labels"], second["labels"])
        self.assertEqual(first["inertia"], second["inertia"])

    def test_rejects_invalid_k_and_insufficient_customers(self) -> None:
        with self.assertRaises(ValidationError):
            SegmentationRequest(k=1, customers=sample_customers())
        with self.assertRaises(ValidationError):
            SegmentationRequest(k=3, customers=sample_customers()[:2])

    def test_rejects_negative_features_and_duplicate_ids(self) -> None:
        negative = sample_customers()
        negative[0]["gastoAcumulado"] = -1
        with self.assertRaises(ValidationError):
            SegmentationRequest(k=2, customers=negative)

        duplicate = sample_customers()
        duplicate[1]["id"] = duplicate[0]["id"]
        with self.assertRaises(ValidationError):
            SegmentationRequest(k=2, customers=duplicate)


if __name__ == "__main__":
    unittest.main()