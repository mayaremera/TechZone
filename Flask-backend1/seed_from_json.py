import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app import app, db, Category, Product, ProductImage


JSON_PATH = (
    Path(__file__).resolve().parent.parent
    / "TechZone1"
    / "src"
    / "data"
    / "products.json"
)


def stock_to_quantity(stock_value):
    if not isinstance(stock_value, str):
        return 0
    return 20 if stock_value.strip().lower() == "in stock" else 0


def valid_image_url(url):
    return isinstance(url, str) and url.strip().startswith(("http://", "https://"))


def main():
    if not JSON_PATH.exists():
        raise FileNotFoundError(f"Could not find products file: {JSON_PATH}")

    payload = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    products = payload.get("products", [])
    if not isinstance(products, list):
        raise ValueError("Invalid products.json format: `products` must be a list.")

    with app.app_context():
        db.create_all()

        # Clear catalog data first (safe order for FK constraints).
        ProductImage.query.delete()
        Product.query.delete()
        Category.query.delete()
        db.session.commit()

        category_map = {}
        seeded_products = 0
        seeded_images = 0

        for item in products:
            category_name = str(item.get("category", "Uncategorized")).strip() or "Uncategorized"
            category = category_map.get(category_name)
            if category is None:
                category = Category(name=category_name)
                db.session.add(category)
                db.session.flush()
                category_map[category_name] = category

            product_id = int(item["id"])
            product = Product(
                product_id=product_id,
                name=str(item.get("name", "")).strip() or f"Product {product_id}",
                price=float(item.get("price", 0)),
                description=str(item.get("description", "")),
                available_items=stock_to_quantity(item.get("stock")),
                category_id=category.category_id,
            )
            db.session.add(product)
            db.session.flush()
            seeded_products += 1

            for image_key in ("image1", "image2", "image3", "image4", "image5"):
                image_url = item.get(image_key)
                if valid_image_url(image_url):
                    db.session.add(
                        ProductImage(product_id=product.product_id, image_url=image_url.strip())
                    )
                    seeded_images += 1

        db.session.commit()

        # Keep PostgreSQL sequence in sync when explicit product IDs are inserted.
        max_product_id = db.session.query(db.func.max(Product.product_id)).scalar()
        is_postgres = db.engine.dialect.name == "postgresql"
        if is_postgres and max_product_id is not None:
            db.session.execute(
                text("SELECT setval('products_product_id_seq', :next_id)"),
                {"next_id": max_product_id + 1},
            )
            db.session.commit()

        print(
            f"Seeding complete: {seeded_products} products, "
            f"{len(category_map)} categories, {seeded_images} images."
        )


if __name__ == "__main__":
    try:
        main()
    except OperationalError as exc:
        print("\nDatabase connection failed.")
        print("Current DATABASE_URI is unreachable.")
        print("If PostgreSQL is not running, use SQLite quickly by setting:")
        print("DATABASE_URI=sqlite:///ecommerce.db")
        print("\nOriginal error:")
        print(str(exc))
