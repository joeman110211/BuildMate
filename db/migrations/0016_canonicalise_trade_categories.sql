-- Canonicalise pre-grouped BuildPair trade categories into the current taxonomy.
-- This is intentionally idempotent: already-current values are left unchanged.

-- Legacy primary trader category.
WITH category_map(old_name, new_name) AS (VALUES
  ('Bathroom Fitting', 'Bathrooms'),
  ('Kitchen Fitting', 'Kitchens'),
  ('EV Chargers', 'Renewables & EV'),
  ('Solar & Renewables', 'Renewables & EV'),
  ('General Building', 'Building & Extensions'),
  ('Building', 'Building & Extensions'),
  ('Extensions', 'Building & Extensions'),
  ('Loft Conversions', 'Conversions'),
  ('Loft Boarding & Storage', 'Conversions'),
  ('Garage Conversions', 'Conversions'),
  ('Basement & Cellar Conversions', 'Conversions'),
  ('Bricklaying', 'Brickwork & Masonry'),
  ('Stone Masonry', 'Brickwork & Masonry'),
  ('Joinery', 'Carpentry & Joinery'),
  ('Plastering', 'Plastering, Rendering & Dry Lining'),
  ('Plastering & Rendering', 'Plastering, Rendering & Dry Lining'),
  ('Dry Lining & Partitioning', 'Plastering, Rendering & Dry Lining'),
  ('Roofing', 'Roofing & Roofline'),
  ('Guttering, Fascias & Soffits', 'Roofing & Roofline'),
  ('Windows & Doors', 'Windows, Doors & Glazing'),
  ('Glazing', 'Windows, Doors & Glazing'),
  ('Garage Doors & Automated Gates', 'Windows, Doors & Glazing'),
  ('Blinds, Shutters & Awnings', 'Windows, Doors & Glazing'),
  ('Flooring', 'Flooring & Screeding'),
  ('Carpet Fitting', 'Flooring & Screeding'),
  ('Screeding & Floor Preparation', 'Flooring & Screeding'),
  ('Driveways & Paving', 'Driveways, Paving & Groundworks'),
  ('Groundworks', 'Driveways, Paving & Groundworks'),
  ('Concrete & Formwork', 'Driveways, Paving & Groundworks'),
  ('Piling & Foundations', 'Driveways, Paving & Groundworks'),
  ('Drainage', 'Drainage & Sewage'),
  ('Septic Tanks & Sewage Treatment', 'Drainage & Sewage'),
  ('Damp Proofing', 'Damp Proofing & Insulation'),
  ('Insulation', 'Damp Proofing & Insulation'),
  ('Cladding', 'Cladding & Exterior Finishes'),
  ('Smart Home, CCTV & Alarms', 'Security, Smart Home & Locksmiths'),
  ('Locksmith', 'Security, Smart Home & Locksmiths'),
  ('Handyman', 'Handyman & Property Maintenance'),
  ('Property Maintenance', 'Handyman & Property Maintenance'),
  ('Appliance Installation', 'Kitchens'),
  ('Shopfitting & Commercial Fit-Out', 'Commercial Fit-Out & Access'),
  ('Scaffolding', 'Commercial Fit-Out & Access'),
  ('Demolition', 'Demolition, Asbestos & Waste'),
  ('Asbestos Survey & Removal', 'Demolition, Asbestos & Waste'),
  ('Waste Removal', 'Demolition, Asbestos & Waste'),
  ('Pressure Washing', 'Cleaning, Exterior Care & Pest Control'),
  ('Cleaning', 'Cleaning, Exterior Care & Pest Control'),
  ('Pest Control', 'Cleaning, Exterior Care & Pest Control'),
  ('Garden Rooms & Outbuildings', 'Garden Buildings & Leisure'),
  ('Conservatories', 'Garden Buildings & Leisure'),
  ('Swimming Pools & Hot Tubs', 'Garden Buildings & Leisure'),
  ('Metalwork & Welding', 'Building & Extensions'),
  ('Architectural & Planning Services', 'Professional Building Services'),
  ('Structural Engineering', 'Professional Building Services'),
  ('Building Surveying', 'Professional Building Services')
)
UPDATE trader_profiles tp
SET trade_category = map.new_name,
    updated_at = now()
FROM category_map map
WHERE tp.trade_category = map.old_name;

-- Multi-category trader selections. Keep the first occurrence where several old
-- categories collapse into the same grouped category, preserving selection order.
WITH category_map(old_name, new_name) AS (VALUES
  ('Bathroom Fitting', 'Bathrooms'), ('Kitchen Fitting', 'Kitchens'),
  ('EV Chargers', 'Renewables & EV'), ('Solar & Renewables', 'Renewables & EV'),
  ('General Building', 'Building & Extensions'), ('Building', 'Building & Extensions'), ('Extensions', 'Building & Extensions'),
  ('Loft Conversions', 'Conversions'), ('Loft Boarding & Storage', 'Conversions'), ('Garage Conversions', 'Conversions'), ('Basement & Cellar Conversions', 'Conversions'),
  ('Bricklaying', 'Brickwork & Masonry'), ('Stone Masonry', 'Brickwork & Masonry'),
  ('Joinery', 'Carpentry & Joinery'),
  ('Plastering', 'Plastering, Rendering & Dry Lining'), ('Plastering & Rendering', 'Plastering, Rendering & Dry Lining'), ('Dry Lining & Partitioning', 'Plastering, Rendering & Dry Lining'),
  ('Roofing', 'Roofing & Roofline'), ('Guttering, Fascias & Soffits', 'Roofing & Roofline'),
  ('Windows & Doors', 'Windows, Doors & Glazing'), ('Glazing', 'Windows, Doors & Glazing'), ('Garage Doors & Automated Gates', 'Windows, Doors & Glazing'), ('Blinds, Shutters & Awnings', 'Windows, Doors & Glazing'),
  ('Flooring', 'Flooring & Screeding'), ('Carpet Fitting', 'Flooring & Screeding'), ('Screeding & Floor Preparation', 'Flooring & Screeding'),
  ('Driveways & Paving', 'Driveways, Paving & Groundworks'), ('Groundworks', 'Driveways, Paving & Groundworks'), ('Concrete & Formwork', 'Driveways, Paving & Groundworks'), ('Piling & Foundations', 'Driveways, Paving & Groundworks'),
  ('Drainage', 'Drainage & Sewage'), ('Septic Tanks & Sewage Treatment', 'Drainage & Sewage'),
  ('Damp Proofing', 'Damp Proofing & Insulation'), ('Insulation', 'Damp Proofing & Insulation'),
  ('Cladding', 'Cladding & Exterior Finishes'),
  ('Smart Home, CCTV & Alarms', 'Security, Smart Home & Locksmiths'), ('Locksmith', 'Security, Smart Home & Locksmiths'),
  ('Handyman', 'Handyman & Property Maintenance'), ('Property Maintenance', 'Handyman & Property Maintenance'),
  ('Appliance Installation', 'Kitchens'),
  ('Shopfitting & Commercial Fit-Out', 'Commercial Fit-Out & Access'), ('Scaffolding', 'Commercial Fit-Out & Access'),
  ('Demolition', 'Demolition, Asbestos & Waste'), ('Asbestos Survey & Removal', 'Demolition, Asbestos & Waste'), ('Waste Removal', 'Demolition, Asbestos & Waste'),
  ('Pressure Washing', 'Cleaning, Exterior Care & Pest Control'), ('Cleaning', 'Cleaning, Exterior Care & Pest Control'), ('Pest Control', 'Cleaning, Exterior Care & Pest Control'),
  ('Garden Rooms & Outbuildings', 'Garden Buildings & Leisure'), ('Conservatories', 'Garden Buildings & Leisure'), ('Swimming Pools & Hot Tubs', 'Garden Buildings & Leisure'),
  ('Metalwork & Welding', 'Building & Extensions'),
  ('Architectural & Planning Services', 'Professional Building Services'), ('Structural Engineering', 'Professional Building Services'), ('Building Surveying', 'Professional Building Services')
), rebuilt AS (
  SELECT tp.id,
         ARRAY(
           SELECT mapped_name
           FROM (
             SELECT coalesce(map.new_name, item.category) AS mapped_name, min(item.ordinality) AS first_position
             FROM unnest(tp.trade_categories) WITH ORDINALITY AS item(category, ordinality)
             LEFT JOIN category_map map ON map.old_name = item.category
             GROUP BY coalesce(map.new_name, item.category)
             ORDER BY first_position
           ) deduped
         ) AS categories
  FROM trader_profiles tp
)
UPDATE trader_profiles tp
SET trade_categories = rebuilt.categories,
    updated_at = now()
FROM rebuilt
WHERE tp.id = rebuilt.id
  AND tp.trade_categories IS DISTINCT FROM rebuilt.categories;

-- Existing jobs must use the same canonical category as matching trader profiles.
WITH category_map(old_name, new_name) AS (VALUES
  ('Bathroom Fitting', 'Bathrooms'), ('Kitchen Fitting', 'Kitchens'),
  ('EV Chargers', 'Renewables & EV'), ('Solar & Renewables', 'Renewables & EV'),
  ('General Building', 'Building & Extensions'), ('Building', 'Building & Extensions'), ('Extensions', 'Building & Extensions'),
  ('Loft Conversions', 'Conversions'), ('Loft Boarding & Storage', 'Conversions'), ('Garage Conversions', 'Conversions'), ('Basement & Cellar Conversions', 'Conversions'),
  ('Bricklaying', 'Brickwork & Masonry'), ('Stone Masonry', 'Brickwork & Masonry'), ('Joinery', 'Carpentry & Joinery'),
  ('Plastering', 'Plastering, Rendering & Dry Lining'), ('Plastering & Rendering', 'Plastering, Rendering & Dry Lining'), ('Dry Lining & Partitioning', 'Plastering, Rendering & Dry Lining'),
  ('Roofing', 'Roofing & Roofline'), ('Guttering, Fascias & Soffits', 'Roofing & Roofline'),
  ('Windows & Doors', 'Windows, Doors & Glazing'), ('Glazing', 'Windows, Doors & Glazing'), ('Garage Doors & Automated Gates', 'Windows, Doors & Glazing'), ('Blinds, Shutters & Awnings', 'Windows, Doors & Glazing'),
  ('Flooring', 'Flooring & Screeding'), ('Carpet Fitting', 'Flooring & Screeding'), ('Screeding & Floor Preparation', 'Flooring & Screeding'),
  ('Driveways & Paving', 'Driveways, Paving & Groundworks'), ('Groundworks', 'Driveways, Paving & Groundworks'), ('Concrete & Formwork', 'Driveways, Paving & Groundworks'), ('Piling & Foundations', 'Driveways, Paving & Groundworks'),
  ('Drainage', 'Drainage & Sewage'), ('Septic Tanks & Sewage Treatment', 'Drainage & Sewage'),
  ('Damp Proofing', 'Damp Proofing & Insulation'), ('Insulation', 'Damp Proofing & Insulation'), ('Cladding', 'Cladding & Exterior Finishes'),
  ('Smart Home, CCTV & Alarms', 'Security, Smart Home & Locksmiths'), ('Locksmith', 'Security, Smart Home & Locksmiths'),
  ('Handyman', 'Handyman & Property Maintenance'), ('Property Maintenance', 'Handyman & Property Maintenance'), ('Appliance Installation', 'Kitchens'),
  ('Shopfitting & Commercial Fit-Out', 'Commercial Fit-Out & Access'), ('Scaffolding', 'Commercial Fit-Out & Access'),
  ('Demolition', 'Demolition, Asbestos & Waste'), ('Asbestos Survey & Removal', 'Demolition, Asbestos & Waste'), ('Waste Removal', 'Demolition, Asbestos & Waste'),
  ('Pressure Washing', 'Cleaning, Exterior Care & Pest Control'), ('Cleaning', 'Cleaning, Exterior Care & Pest Control'), ('Pest Control', 'Cleaning, Exterior Care & Pest Control'),
  ('Garden Rooms & Outbuildings', 'Garden Buildings & Leisure'), ('Conservatories', 'Garden Buildings & Leisure'), ('Swimming Pools & Hot Tubs', 'Garden Buildings & Leisure'),
  ('Metalwork & Welding', 'Building & Extensions'),
  ('Architectural & Planning Services', 'Professional Building Services'), ('Structural Engineering', 'Professional Building Services'), ('Building Surveying', 'Professional Building Services')
)
UPDATE jobs j
SET category = map.new_name,
    updated_at = now()
FROM category_map map
WHERE j.category = map.old_name;

-- Saved searches use the same taxonomy and would otherwise silently stop matching.
WITH category_map(old_name, new_name) AS (VALUES
  ('Bathroom Fitting', 'Bathrooms'), ('Kitchen Fitting', 'Kitchens'),
  ('EV Chargers', 'Renewables & EV'), ('Solar & Renewables', 'Renewables & EV'),
  ('General Building', 'Building & Extensions'), ('Building', 'Building & Extensions'), ('Extensions', 'Building & Extensions'),
  ('Loft Conversions', 'Conversions'), ('Loft Boarding & Storage', 'Conversions'), ('Garage Conversions', 'Conversions'), ('Basement & Cellar Conversions', 'Conversions'),
  ('Bricklaying', 'Brickwork & Masonry'), ('Stone Masonry', 'Brickwork & Masonry'), ('Joinery', 'Carpentry & Joinery'),
  ('Plastering', 'Plastering, Rendering & Dry Lining'), ('Plastering & Rendering', 'Plastering, Rendering & Dry Lining'), ('Dry Lining & Partitioning', 'Plastering, Rendering & Dry Lining'),
  ('Roofing', 'Roofing & Roofline'), ('Guttering, Fascias & Soffits', 'Roofing & Roofline'),
  ('Windows & Doors', 'Windows, Doors & Glazing'), ('Glazing', 'Windows, Doors & Glazing'), ('Garage Doors & Automated Gates', 'Windows, Doors & Glazing'), ('Blinds, Shutters & Awnings', 'Windows, Doors & Glazing'),
  ('Flooring', 'Flooring & Screeding'), ('Carpet Fitting', 'Flooring & Screeding'), ('Screeding & Floor Preparation', 'Flooring & Screeding'),
  ('Driveways & Paving', 'Driveways, Paving & Groundworks'), ('Groundworks', 'Driveways, Paving & Groundworks'), ('Concrete & Formwork', 'Driveways, Paving & Groundworks'), ('Piling & Foundations', 'Driveways, Paving & Groundworks'),
  ('Drainage', 'Drainage & Sewage'), ('Septic Tanks & Sewage Treatment', 'Drainage & Sewage'),
  ('Damp Proofing', 'Damp Proofing & Insulation'), ('Insulation', 'Damp Proofing & Insulation'), ('Cladding', 'Cladding & Exterior Finishes'),
  ('Smart Home, CCTV & Alarms', 'Security, Smart Home & Locksmiths'), ('Locksmith', 'Security, Smart Home & Locksmiths'),
  ('Handyman', 'Handyman & Property Maintenance'), ('Property Maintenance', 'Handyman & Property Maintenance'), ('Appliance Installation', 'Kitchens'),
  ('Shopfitting & Commercial Fit-Out', 'Commercial Fit-Out & Access'), ('Scaffolding', 'Commercial Fit-Out & Access'),
  ('Demolition', 'Demolition, Asbestos & Waste'), ('Asbestos Survey & Removal', 'Demolition, Asbestos & Waste'), ('Waste Removal', 'Demolition, Asbestos & Waste'),
  ('Pressure Washing', 'Cleaning, Exterior Care & Pest Control'), ('Cleaning', 'Cleaning, Exterior Care & Pest Control'), ('Pest Control', 'Cleaning, Exterior Care & Pest Control'),
  ('Garden Rooms & Outbuildings', 'Garden Buildings & Leisure'), ('Conservatories', 'Garden Buildings & Leisure'), ('Swimming Pools & Hot Tubs', 'Garden Buildings & Leisure'),
  ('Metalwork & Welding', 'Building & Extensions'),
  ('Architectural & Planning Services', 'Professional Building Services'), ('Structural Engineering', 'Professional Building Services'), ('Building Surveying', 'Professional Building Services')
)
UPDATE saved_job_searches s
SET category = map.new_name,
    updated_at = now()
FROM category_map map
WHERE s.category = map.old_name;
