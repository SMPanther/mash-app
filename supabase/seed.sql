-- Optional: run this AFTER schema.sql, in the same SQL editor. Gives you
-- real data to look at immediately instead of empty pages — the slugs
-- here match exactly what's hardcoded in app/page.js and the sticker
-- filenames in public/assets/category/, so the icons will line up.

insert into menu_categories (name, slug, sort_order) values
  ('Burgers', 'burgers', 1),
  ('Ramen', 'ramen', 2),
  ('Pizzas', 'pizzas', 3),
  ('BBQ & Grills', 'bbq-grills', 4),
  ('Pakistani Cuisine', 'pakistani-cuisine', 5),
  ('Desserts', 'desserts', 6),
  ('Drinks', 'drinks', 7),
  ('Deals & Combos', 'deals-combos', 8);

-- A couple of test dishes so /menu/burgers actually shows something.
insert into menu_items (category_id, name, description, price, is_available)
select id, 'Classic Smash Burger', 'Beef patty, cheddar, house sauce', 850, true
from menu_categories where slug = 'burgers';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Spicy Chicken Burger', 'Crispy fried chicken, chili mayo', 780, true
from menu_categories where slug = 'burgers';

-- A dish with variations, to test the size-picker on the menu page.
insert into menu_items (category_id, name, description, price, is_available)
select id, 'Pepperoni Pizza', 'Classic pepperoni, mozzarella', 1200, true
from menu_categories where slug = 'pizzas'
returning id; -- note the returned id, then run the block below with it filled in

-- Copy the id printed above into the two lines below, then run this
-- separately (Postgres can't reference the previous insert's result
-- directly in the same statement):
--
-- insert into menu_item_variations (menu_item_id, name, price, is_default) values
--   ('<paste-pizza-id-here>', 'Small', 950, false),
--   ('<paste-pizza-id-here>', 'Medium', 1200, true),
--   ('<paste-pizza-id-here>', 'Large', 1550, false);

-- More items across categories, so the category wheel has something to
-- show when you scroll to each one, not just Burgers/Pizzas.
insert into menu_items (category_id, name, description, price, is_available)
select id, 'Spicy Miso Ramen', 'Rich miso broth, chashu pork, soft egg', 950, true
from menu_categories where slug = 'ramen';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Shoyu Tonkotsu Ramen', 'Pork bone broth, soy tare, scallions', 980, true
from menu_categories where slug = 'ramen';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Chicken Karahi', 'Traditional wok-cooked chicken, ginger, tomato', 1450, true
from menu_categories where slug = 'pakistani-cuisine';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Chicken Biryani', 'Fragrant basmati rice, spiced chicken', 650, true
from menu_categories where slug = 'pakistani-cuisine';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Beef Seekh Kebab', 'Charcoal-grilled minced beef skewers', 850, true
from menu_categories where slug = 'bbq-grills';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Fudge Brownie Sundae', 'Warm brownie, vanilla ice cream, hot fudge', 550, true
from menu_categories where slug = 'desserts';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Mint Lemonade', 'Fresh mint, lime, soda', 350, true
from menu_categories where slug = 'drinks';

insert into menu_items (category_id, name, description, price, is_available)
select id, 'Iced Spanish Latte', 'Espresso, condensed milk, cold milk', 420, true
from menu_categories where slug = 'drinks';

-- Flag one dish as the hero/spotlight feature on the menu page.
update menu_items set featured = true where name = 'Classic Smash Burger';
