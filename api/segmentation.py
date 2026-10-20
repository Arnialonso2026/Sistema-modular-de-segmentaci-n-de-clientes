from datetime import datetime, timezone

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from .models import SegmentationRequest

FEATURES = ("gastoAcumulado", "visitas6Meses", "antiguedadMeses")


def compute_segmentation(request: SegmentationRequest) -> dict:
    customers = request.customers
    original = np.asarray(
        [[getattr(customer, feature) for feature in FEATURES] for customer in customers],
        dtype=float,
    )
    standardized = StandardScaler().fit_transform(original)

    best_model = None
    for seed in range(42, 52):
        candidate = KMeans(n_clusters=request.k, random_state=seed, n_init=1)
        candidate.fit(standardized)
        if best_model is None or candidate.inertia_ < best_model.inertia_:
            best_model = candidate

    if best_model is None:
        raise RuntimeError("No fue posible calcular la segmentación.")

    labels = best_model.labels_
    distances = np.linalg.norm(standardized - best_model.cluster_centers_[labels], axis=1)
    feature_averages = np.mean(original, axis=0)
    groups = []

    for group_id in range(request.k):
        member_mask = labels == group_id
        members = original[member_mask]
        group_distances = distances[member_mask]
        centroid_values = np.mean(members, axis=0) if len(members) else np.zeros(len(FEATURES))
        centroid = {feature: float(centroid_values[index]) for index, feature in enumerate(FEATURES)}

        groups.append({
            "id": group_id,
            "cantidad": int(len(members)),
            "gastoPromedio": centroid["gastoAcumulado"],
            "visitasPromedio": centroid["visitas6Meses"],
            "antiguedadPromedio": centroid["antiguedadMeses"],
            "centroid": centroid,
            "standardizedCentroid": best_model.cluster_centers_[group_id].astype(float).tolist(),
            "averageDistance": float(np.mean(group_distances)) if len(group_distances) else 0.0,
            "inertia": float(np.sum(group_distances ** 2)),
        })

    return {
        "k": request.k,
        "fechaEjecucion": datetime.now(timezone.utc).isoformat(),
        "cantidadProcesada": len(customers),
        "inertia": float(best_model.inertia_),
        "globalAverage": {
            feature: float(feature_averages[index])
            for index, feature in enumerate(FEATURES)
        },
        "labels": [
            {"id": customer.id, "segmento": int(labels[index])}
            for index, customer in enumerate(customers)
        ],
        "standardizedFeatures": [
            {"id": customer.id, "values": standardized[index].astype(float).tolist()}
            for index, customer in enumerate(customers)
        ],
        "distances": [
            {"id": customer.id, "distance": float(distances[index])}
            for index, customer in enumerate(customers)
        ],
        "groups": groups,
    }