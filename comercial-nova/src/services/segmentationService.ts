
import type {
  SegmentationRequest,
  SegmentationResponse,
} from "../types/segmentation";

export interface SegmentationService {
  run(
    request: SegmentationRequest,
  ): Promise<SegmentationResponse>;
}

export class SegmentationServiceNotImplementedError extends Error {
  constructor() {
    super(
      "La ejecución de segmentación se implementará en las fases 4 y 5.",
    );
    this.name = "SegmentationServiceNotImplementedError";
  }
}

export const segmentationService: SegmentationService = {
  async run() {
    throw new SegmentationServiceNotImplementedError();
  },
};
