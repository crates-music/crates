export interface AutoCategorizePreview {
  proposedCrates: number;
  albumsWillBeCategorized: number;
  totalLibraryAlbums: number;
  coveragePercent: number;
  proposals: CrateProposalDTO[];
  recommendation: string;
}

export interface SimpleAlbumReference {
  title: string;
  artist: string;
  albumId?: number;
  artworkUrl?: string;
}

export interface CrateProposalDTO {
  name: string;
  albumCount: number;
  description: string;
  strategy: string;
  albums: SimpleAlbumReference[];
}

export interface AutoCategorizeResult {
  cratesCreated: number;
  albumsCategorized: number;
  coveragePercent: number;
  crates: any[]; // CrateSummary from backend
  processingTimeMs: number;
  message: string;
  genreEnrichmentSuccessful: boolean;
}
