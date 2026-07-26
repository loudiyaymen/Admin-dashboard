CREATE TABLE "navigation_graphs" (
  "building_id" TEXT NOT NULL,
  "graph_data" JSONB NOT NULL,
  "source_file" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "navigation_graphs_pkey" PRIMARY KEY ("building_id")
);

ALTER TABLE "navigation_graphs"
ADD CONSTRAINT "navigation_graphs_building_id_fkey"
FOREIGN KEY ("building_id") REFERENCES "buildings"("building_id")
ON DELETE CASCADE ON UPDATE CASCADE;
