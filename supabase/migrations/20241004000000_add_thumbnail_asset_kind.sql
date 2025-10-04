-- Add 'thumbnail' to the asset_kind enum
ALTER TYPE asset_kind ADD VALUE 'thumbnail';

-- Add a comment to document the new asset kind
COMMENT ON TYPE asset_kind IS 'Asset kinds: original (user uploads), preprocessed (resized uploads), edge_map (coloring pages), pdf (downloadable PDFs), thumbnail (gallery previews)';
