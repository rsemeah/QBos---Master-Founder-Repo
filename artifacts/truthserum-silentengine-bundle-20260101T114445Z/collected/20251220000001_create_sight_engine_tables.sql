-- SightEngine™ Database Schema
-- Visual quality standards enforcement and asset tracking

-- Visual Assets Table
-- Tracks all visual assets with their specifications and tier requirements
CREATE TABLE sight_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('hero-image', 'product-shot', 'brand-visual', 'logo', 'icon', 'background', 'character', 'environment')),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C')),
  
  -- Asset Specifications
  resolution_width INTEGER NOT NULL,
  resolution_height INTEGER NOT NULL,
  camera_model TEXT,
  lens_type TEXT,
  aperture NUMERIC(3, 1),
  color_space TEXT,
  bit_depth INTEGER,
  lighting_style TEXT,
  
  -- File Information
  file_url TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  
  -- Indexing
  CONSTRAINT sight_assets_project_name_unique UNIQUE (project_id, asset_name)
);

CREATE INDEX idx_sight_assets_project_id ON sight_assets(project_id);
CREATE INDEX idx_sight_assets_tier ON sight_assets(tier);
CREATE INDEX idx_sight_assets_asset_type ON sight_assets(asset_type);
CREATE INDEX idx_sight_assets_created_at ON sight_assets(created_at DESC);

-- Validation Results Table
-- Stores validation results for each asset
CREATE TABLE sight_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES sight_assets(id) ON DELETE CASCADE,
  
  -- Validation Metadata
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validator_version TEXT NOT NULL,
  
  -- Results
  passed BOOLEAN NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  
  -- Individual Checks (0-100 scores)
  resolution_score INTEGER CHECK (resolution_score >= 0 AND resolution_score <= 100),
  camera_score INTEGER CHECK (camera_score >= 0 AND camera_score <= 100),
  lens_score INTEGER CHECK (lens_score >= 0 AND lens_score <= 100),
  aperture_score INTEGER CHECK (aperture_score >= 0 AND aperture_score <= 100),
  color_space_score INTEGER CHECK (color_space_score >= 0 AND color_space_score <= 100),
  bit_depth_score INTEGER CHECK (bit_depth_score >= 0 AND bit_depth_score <= 100),
  lighting_score INTEGER CHECK (lighting_score >= 0 AND lighting_score <= 100),
  flat_lighting_score INTEGER CHECK (flat_lighting_score >= 0 AND flat_lighting_score <= 100),
  saturation_score INTEGER CHECK (saturation_score >= 0 AND saturation_score <= 100),
  upscale_artifacts_score INTEGER CHECK (upscale_artifacts_score >= 0 AND upscale_artifacts_score <= 100),
  ai_artifacts_score INTEGER CHECK (ai_artifacts_score >= 0 AND ai_artifacts_score <= 100),
  
  -- Failures and Issues
  issues JSONB DEFAULT '[]'::jsonb,
  
  -- Indexing
  CONSTRAINT sight_validation_results_asset_validated_unique UNIQUE (asset_id, validated_at)
);

CREATE INDEX idx_sight_validation_asset_id ON sight_validation_results(asset_id);
CREATE INDEX idx_sight_validation_passed ON sight_validation_results(passed);
CREATE INDEX idx_sight_validation_score ON sight_validation_results(overall_score DESC);
CREATE INDEX idx_sight_validation_validated_at ON sight_validation_results(validated_at DESC);

-- AI Prompt Standards Table
-- Tracks generated prompts with embedded quality standards
CREATE TABLE sight_prompt_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C')),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('hero-image', 'product-shot', 'brand-visual', 'logo', 'icon', 'background', 'character', 'environment')),
  
  -- Generated Prompt
  prompt_header TEXT NOT NULL,
  full_prompt TEXT,
  
  -- Metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_by_project_id UUID,
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  success_rate NUMERIC(5, 2)
);

CREATE INDEX idx_sight_prompt_tier ON sight_prompt_standards(tier);
CREATE INDEX idx_sight_prompt_asset_type ON sight_prompt_standards(asset_type);
CREATE INDEX idx_sight_prompt_generated_at ON sight_prompt_standards(generated_at DESC);

-- Tier Enforcement Logs
-- Audit trail for tier requirement enforcement
CREATE TABLE sight_tier_enforcement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES sight_assets(id) ON DELETE SET NULL,
  project_id UUID NOT NULL,
  
  -- Enforcement Action
  action TEXT NOT NULL CHECK (action IN ('accepted', 'rejected', 'warned', 'overridden')),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C')),
  reason TEXT NOT NULL,
  
  -- Override Information (if applicable)
  overridden_by UUID,
  override_reason TEXT,
  
  -- Metadata
  enforced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sight_enforcement_project_id ON sight_tier_enforcement_logs(project_id);
CREATE INDEX idx_sight_enforcement_action ON sight_tier_enforcement_logs(action);
CREATE INDEX idx_sight_enforcement_enforced_at ON sight_tier_enforcement_logs(enforced_at DESC);

-- Projects Table (shared across engines)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL,
  
  -- Configuration
  default_sight_tier TEXT DEFAULT 'B' CHECK (default_sight_tier IN ('A', 'B', 'C')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_org_id ON projects(organization_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sight_assets_updated_at
  BEFORE UPDATE ON sight_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE sight_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sight_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE sight_prompt_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sight_tier_enforcement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Example policies (customize based on your auth setup)
-- Users can read their organization's projects
CREATE POLICY "Users can view their organization's projects"
  ON projects FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Users can read their project's assets
CREATE POLICY "Users can view their project's assets"
  ON sight_assets FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comments
COMMENT ON TABLE sight_assets IS 'SightEngine™: Visual assets with quality tier specifications';
COMMENT ON TABLE sight_validation_results IS 'SightEngine™: Validation results with detailed scoring';
COMMENT ON TABLE sight_prompt_standards IS 'SightEngine™: AI prompt templates with quality standards';
COMMENT ON TABLE sight_tier_enforcement_logs IS 'SightEngine™: Audit trail for tier enforcement actions';
