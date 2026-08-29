from flask import Flask, jsonify, request, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from dotenv import load_dotenv
import os
from flask_cors import CORS
import jwt as pyjwt
import requests
from functools import wraps
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import base64
import logging
from sqlalchemy.sql import text

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)

def normalize_database_uri(uri):
    if not uri:
        return uri
    if uri.startswith("postgres://"):
        uri = "postgresql://" + uri[len("postgres://"):]
    if "sslmode=" not in uri and ("neon.tech" in uri or "render.com" in uri):
        uri += ("&" if "?" in uri else "?") + "sslmode=require"
    return uri

app.config["SQLALCHEMY_DATABASE_URI"] = normalize_database_uri(
    os.getenv("DATABASE_URI", "postgresql://postgres:TWF5YXlg@localhost/ecommerce_db")
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "your-secret-key-here")

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN", "dev-maash7o71lvlk8iq.us.auth0.com")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE", "https://ecommerce-api")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID", "cUc52E47RmMk6xDFR624kcJFCVTujzL7")

db = SQLAlchemy(app)
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGIN",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
    ).split(",")
    if origin.strip()
]
CORS(app, resources={
    r"/*": {"origins": FRONTEND_ORIGINS}
}, supports_credentials=True)
jwks_client = pyjwt.PyJWKClient(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")

IS_PRODUCTION = bool(os.getenv("RENDER") or os.getenv("FLASK_ENV") == "production")
logging.basicConfig(level=logging.INFO if IS_PRODUCTION else logging.DEBUG)
app.logger.setLevel(logging.INFO if IS_PRODUCTION else logging.DEBUG)

# Models
class Category(db.Model):
    __tablename__ = 'categories'
    category_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    products = db.relationship('Product', backref='category', lazy=True, cascade='all, delete-orphan')

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    auth0_id = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(8), default='customer')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    wishlist = db.relationship('Wishlist', backref='user', cascade='all, delete-orphan')
    addresses = db.relationship('Address', backref='user', cascade='all, delete-orphan')
    order_items = db.relationship('OrderItem', backref='user')
    credit_cards = db.relationship('SavedCreditCard', backref='user', cascade='all, delete-orphan')
    cart = db.relationship('Cart', backref='user', cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='user', cascade='all, delete-orphan')

class Product(db.Model):
    __tablename__ = 'products'
    product_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.Text)
    available_items = db.Column(db.Integer, default=0)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.category_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    images = db.relationship('ProductImage', backref='product', lazy='dynamic', cascade='all, delete-orphan')

class ProductImage(db.Model):
    __tablename__ = 'product_images'
    image_id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    image_url = db.Column(db.Text)  # Stores external URLs as strings

class Wishlist(db.Model):
    __tablename__ = 'wishlist'
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Address(db.Model):
    __tablename__ = 'addresses'
    address_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    full_address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    order_item_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    vat_per_unit = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class SavedCreditCard(db.Model):
    __tablename__ = 'saved_credit_cards'
    card_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    card_number = db.Column(db.String(255), nullable=False)
    expiry_date = db.Column(db.String(7), nullable=False)
    card_type = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Payment(db.Model):
    __tablename__ = 'payments'
    payment_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    order_id = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Pending')
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Cart(db.Model):
    __tablename__ = 'cart'
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.product_id'), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

def user_public_payload(user, message=None):
    payload = {
        "user_id": user.user_id,
        "auth0_id": user.auth0_id,
        "name": user.name,
        "email": user.email,
        "role": (user.role or "customer").strip().lower(),
    }
    if message:
        payload["message"] = message
    return payload


def resolve_db_user(payload):
    sub = payload.get("sub")
    user = User.query.filter_by(auth0_id=sub).first() if sub else None
    if user:
        return user

    email = payload.get("email") or payload.get(f"{AUTH0_AUDIENCE}/email")
    if not email:
        return None

    user = User.query.filter_by(email=email.strip().lower()).first()
    if user and sub and user.auth0_id != sub:
        user.auth0_id = sub
        db.session.commit()
        app.logger.info("Linked %s to auth0_id %s", user.email, sub)
    return user


def _extract_bearer_token(header):
    if not header:
        return None
    parts = header.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None


# Authentication Decorator
def auth0_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = _extract_bearer_token(request.headers.get("Authorization"))
            if not token:
                app.logger.error("No Authorization header provided")
                return jsonify({"message": "Missing Authorization header"}), 401
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                allowed_audiences = [aud for aud in (AUTH0_AUDIENCE, AUTH0_CLIENT_ID) if aud]
                payload = pyjwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    audience=allowed_audiences,
                    issuer=f"https://{AUTH0_DOMAIN}/",
                    leeway=30,
                )
            except Exception as e:
                app.logger.error(f"Token validation failed: {str(e)}")
                return jsonify({"message": f"Token validation failed: {str(e)}"}), 401

            request.auth0_user = payload
            request.current_user_payload = payload
            user = resolve_db_user(payload)
            if role:
                if not user:
                    app.logger.error(f"User not found for sub: {payload['sub']}")
                    return jsonify({"message": "User not found"}), 404
                if (user.role or "").strip().lower() != role:
                    app.logger.warning(
                        f"Access denied for {user.email}: Requires {role}, has {user.role}"
                    )
                    return jsonify({"message": f"Requires {role} privileges"}), 403
            request.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator

admin_required = auth0_required(role='admin')

# Routes
@app.route("/categories", methods=["GET"])
def get_categories():
    categories = Category.query.all()
    return jsonify([{
        "category_id": cat.category_id,
        "name": cat.name
    } for cat in categories])

@app.route("/categories/<int:category_id>", methods=["GET"])
def get_products_by_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)
        products = Product.query.filter_by(category_id=category_id).all()
        result = []
        for p in products:
            # Fetch image URLs directly from the product_images table
            image_urls = [img.image_url for img in p.images.all() if img.image_url]
            product_data = {
                "product_id": p.product_id,
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "available_items": p.available_items,
                "category": p.category.name,
                "images": image_urls  # Return the raw image URLs as a list
            }
            result.append(product_data)
        app.logger.debug(f"Fetched {len(result)} products for category {category_id}")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error fetching products by category {category_id}: {str(e)}")
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500

@app.route("/products", methods=["GET"])
def get_products():
    try:
        products = Product.query.all()
        if not products:
            app.logger.warning("No products found in the database")
            return jsonify({"message": "No products found"}), 200

        result = []
        for p in products:
            # Fetch image URLs directly from the product_images table
            image_urls = [img.image_url for img in p.images.all() if img.image_url]
            product_data = {
                "product_id": p.product_id,
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "available_items": p.available_items,
                "category": p.category.name if p.category else "Uncategorized",
                "images": image_urls  # Return the raw image URLs as a list
            }
            result.append(product_data)
            app.logger.debug(f"Processed product: {p.name}, product_id: {p.product_id}")

        app.logger.info(f"Successfully fetched {len(result)} products")
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error fetching products: {str(e)}", exc_info=True)
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500

@app.route("/product/<int:product_id>", methods=["GET"])
def get_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        # Fetch image URLs directly from the product_images table
        image_urls = [img.image_url for img in product.images.all() if img.image_url]
        product_data = {
            "product_id": product.product_id,
            "name": product.name,
            "price": float(product.price),
            "description": product.description,
            "available_items": product.available_items,
            "category": product.category.name if product.category else "Uncategorized",
            "category_id": product.category_id,
            "images": image_urls,  # Return the raw image URLs as a list
            "features": []
        }
        return jsonify(product_data)
    except Exception as e:
        app.logger.error(f"Error fetching product {product_id}: {str(e)}")
        return jsonify({"message": f"Failed to fetch product: {str(e)}"}), 500

@app.route("/api/register-user", methods=["POST"])
@auth0_required()
def register_user():
    app.logger.info("Received request to /api/register-user")
    payload = getattr(request, "auth0_user", None) or {}
    body = request.get_json(silent=True) or {}
    user_data = body.get("user") or {}

    auth0_id = payload.get("sub") or user_data.get("sub")
    email = (
        user_data.get("email")
        or payload.get("email")
        or payload.get(f"{AUTH0_AUDIENCE}/email")
    )
    if not email:
        for key, value in payload.items():
            if isinstance(key, str) and key.endswith("/email") and isinstance(value, str) and "@" in value:
                email = value
                break
    name = (
        user_data.get("name")
        or payload.get("name")
        or payload.get("nickname")
        or user_data.get("nickname")
        or (email.split("@")[0] if email else "Unknown")
    )

    if not auth0_id:
        app.logger.error("Missing auth0 id in token")
        return jsonify({"message": "Missing authentication data"}), 401
    if not email:
        app.logger.error("Missing email for Auth0 user %s", auth0_id)
        return jsonify({"message": "Missing email on the Auth0 account"}), 400

    email = email.strip().lower()
    email_user = User.query.filter(db.func.lower(User.email) == email).first()
    auth_user = User.query.filter_by(auth0_id=auth0_id).first()

    if email_user and auth_user and email_user.user_id != auth_user.user_id:
        if (auth_user.role or "").strip().lower() == "admin":
            email_user.role = "admin"
        db.session.delete(auth_user)
        db.session.flush()
        auth_user = None

    user = email_user or auth_user
    if user:
        user.auth0_id = auth0_id
        user.email = email
        user.name = name
        if (user.role or "").strip().lower() == "admin":
            user.role = "admin"
        db.session.commit()
        app.logger.info(
            "Synced user %s auth0_id=%s role=%s", email, auth0_id, user.role
        )
        return jsonify(user_public_payload(user, "User synced")), 200

    try:
        user = User(auth0_id=auth0_id, name=name, email=email, role="customer")
        db.session.add(user)
        db.session.commit()
        app.logger.info("User created: %s with auth0_id: %s", email, auth0_id)
        return jsonify(user_public_payload(user, "User created")), 201
    except Exception as e:
        db.session.rollback()
        user = (
            User.query.filter(db.func.lower(User.email) == email).first()
            or User.query.filter_by(auth0_id=auth0_id).first()
        )
        if user:
            user.auth0_id = auth0_id
            db.session.commit()
            return jsonify(user_public_payload(user, "User already exists")), 200
        app.logger.error("Failed to create user %s: %s", email, str(e))
        return jsonify({"message": f"Failed to create user: {str(e)}"}), 500

@app.route("/api/me", methods=["GET"])
@auth0_required()
def get_current_user_profile():
    user = request.current_user
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify(user_public_payload(user))

@app.route("/wishlist/<user_sub>", methods=["GET"])
@auth0_required()
def get_wishlist(user_sub):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    wishlist_items = (
        db.session.query(Wishlist, Product)
        .join(Product, Wishlist.product_id == Product.product_id)
        .filter(Wishlist.user_id == user.user_id)
        .all()
    )
    result = []
    seen_products = set()
    for wishlist, product in wishlist_items:
        if product.product_id not in seen_products:
            # Fetch image URLs from the product_images table
            image_urls = [img.image_url for img in product.images.all() if img.image_url]
            # Use the first image_url or a default if none exist
            image_url = image_urls[0] if image_urls else "https://placehold.co/80x80"
            result.append({
                "product_id": wishlist.product_id,
                "product_name": product.name,
                "price": float(product.price),
                "image_url": image_url,  # Return a single image_url
                "created_at": wishlist.created_at.isoformat()
            })
            seen_products.add(product.product_id)
    app.logger.debug(f"Fetched wishlist for {user_sub}: {len(result)} items")
    return jsonify(result)

@app.route("/wishlist/<user_sub>/<int:product_id>", methods=["POST"])
@auth0_required()
def add_to_wishlist(user_sub, product_id):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
    existing = Wishlist.query.filter_by(user_id=user.user_id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Item already in wishlist"}), 409
    wishlist_item = Wishlist(user_id=user.user_id, product_id=product_id)
    db.session.add(wishlist_item)
    db.session.commit()
    return jsonify({"message": "Item added to wishlist", "product_id": product_id}), 201

@app.route("/wishlist/<user_sub>/<int:product_id>", methods=["DELETE"])
@auth0_required()
def remove_from_wishlist(user_sub, product_id):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    wishlist_item = Wishlist.query.filter_by(user_id=user.user_id, product_id=product_id).first()
    if not wishlist_item:
        return jsonify({"message": "Item not found"}), 404
    db.session.delete(wishlist_item)
    db.session.commit()
    return jsonify({"message": "Item removed from wishlist"}), 200

@app.route("/cart/<user_sub>", methods=["POST"])
@auth0_required()
def add_to_cart(user_sub):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    data = request.get_json()
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    if not product_id or not isinstance(quantity, int) or quantity <= 0:
        return jsonify({"message": "Invalid request data"}), 400
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404
    if product.available_items < quantity:
        return jsonify({"message": "Insufficient stock"}), 400
    existing = Cart.query.filter_by(user_id=user.user_id, product_id=product_id).first()
    if existing:
        existing.quantity += quantity
    else:
        cart_item = Cart(user_id=user.user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)
    db.session.commit()
    return jsonify({"message": "Item added to cart", "product_id": product_id, "quantity": quantity}), 201

@app.route("/orders/<user_sub>", methods=["GET"])
@auth0_required()
def get_orders(user_sub):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    orders = db.session.query(OrderItem).filter_by(user_id=user.user_id).all()
    order_dict = {}
    for order in orders:
        if order.order_id not in order_dict:
            order_dict[order.order_id] = {
                "order_id": order.order_id,
                "total_price": 0,
                "status": order.status,
                "created_at": order.created_at.isoformat(),
                "items": []
            }
        order_dict[order.order_id]["items"].append({
            "order_item_id": order.order_item_id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "unit_price": float(order.unit_price),
            "total_price": float(order.total_price)
        })
        order_dict[order.order_id]["total_price"] += float(order.total_price)

    payments = Payment.query.filter(Payment.order_id.in_(order_dict.keys())).all()
    for payment in payments:
        if payment.order_id in order_dict:
            order_dict[payment.order_id]["payment_method"] = payment.payment_method
            order_dict[payment.order_id]["amount"] = float(payment.amount)

    return jsonify(list(order_dict.values()))

@app.route("/orders/<user_sub>/<int:order_id>", methods=["DELETE"])
@auth0_required()
def delete_order(user_sub, order_id):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    order_items = OrderItem.query.filter_by(order_id=order_id, user_id=user.user_id).all()
    if not order_items:
        return jsonify({"message": "Order not found"}), 404
    
    for item in order_items:
        db.session.delete(item)
    
    payment = Payment.query.filter_by(order_id=order_id, user_id=user.user_id).first()
    if payment:
        db.session.delete(payment)
    
    db.session.commit()
    return jsonify({"message": "Order deleted successfully"}), 200

@app.route("/addresses/<user_sub>", methods=["GET"])
@auth0_required()
def get_addresses(user_sub):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    addresses = Address.query.filter_by(user_id=user.user_id).all()
    return jsonify([{
        "address_id": addr.address_id,
        "full_address": addr.full_address,
        "city": addr.city,
        "postal_code": addr.postal_code,
        "country": addr.country,
        "created_at": addr.created_at.isoformat()
    } for addr in addresses])

@app.route("/addresses/<user_sub>/<int:address_id>", methods=["DELETE"])
@auth0_required()
def delete_address(user_sub, address_id):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    address = Address.query.filter_by(user_id=user.user_id, address_id=address_id).first()
    if not address:
        return jsonify({"message": "Address not found"}), 404
    db.session.delete(address)
    db.session.commit()
    app.logger.info(f"Address {address_id} deleted for user {user_sub}")
    return jsonify({"message": "Address deleted successfully"}), 200

@app.route("/addresses/<user_sub>/<int:address_id>", methods=["PUT"])
@auth0_required()
def update_address(user_sub, address_id):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    address = Address.query.filter_by(user_id=user.user_id, address_id=address_id).first()
    if not address:
        return jsonify({"message": "Address not found"}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    address.full_address = data.get("full_address", address.full_address)
    address.city = data.get("city", address.city)
    address.postal_code = data.get("postal_code", address.postal_code)
    address.country = data.get("country", address.country)
    
    db.session.commit()
    app.logger.info(f"Address {address_id} updated for user {user_sub}")
    return jsonify({
        "message": "Address updated successfully",
        "address": {
            "address_id": address.address_id,
            "full_address": address.full_address,
            "city": address.city,
            "postal_code": address.postal_code,
            "country": address.country,
            "created_at": address.created_at.isoformat()
        }
    }), 200

@app.route("/saved_credit_cards/<user_sub>", methods=["GET"])
@auth0_required()
def get_saved_credit_cards(user_sub):
    user = User.query.filter_by(auth0_id=user_sub).first()
    if not user:
        return jsonify({"message": "User not found"}), 404
    cards = SavedCreditCard.query.filter_by(user_id=user.user_id).all()
    return jsonify([{
        "card_id": card.card_id,
        "card_number": card.card_number,
        "card_type": card.card_type,
        "expiry_date": card.expiry_date,
        "created_at": card.created_at.isoformat()
    } for card in cards])

@app.route('/checkout', methods=['POST'])
@auth0_required()
def checkout():
    app.logger.info("Starting checkout process")
    user = User.query.filter_by(auth0_id=request.auth0_user['sub']).first()
    if not user:
        app.logger.warning(f"User not found for sub: {request.auth0_user['sub']}")
        return jsonify({"message": "User not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        app.logger.error("No checkout data provided or invalid JSON")
        return jsonify({"message": "No checkout data provided or invalid JSON"}), 400

    try:
        app.logger.debug(f"Checkout data received: {data}")
        items = data.get('items', [])
        payment_method = data.get('paymentMethod')
        address_data = data.get('address', {})
        subtotal = float(data.get('subtotal', 0))
        shipping = float(data.get('shipping', 0))
        tax = float(data.get('tax', 0))
        total = float(data.get('total', 0))
        card_details = data.get('cardDetails')

        if not items or not payment_method or not isinstance(address_data, dict):
            app.logger.error("Missing required checkout data")
            return jsonify({"message": "Missing required checkout data (items, paymentMethod, or address)"}), 400

        order_id = int(datetime.now().timestamp())
        app.logger.info(f"Generated order_id: {order_id}")

        with db.session.no_autoflush:
            for item in items:
                if not all(k in item for k in ['id', 'quantity', 'price', 'name']):
                    app.logger.error(f"Invalid item data: {item}")
                    return jsonify({"message": f"Invalid item data: {item}"}), 400
                product = Product.query.get(item['id'])
                if not product:
                    app.logger.warning(f"Product not found: {item['id']}")
                    return jsonify({"message": f"Product {item['name']} not found"}), 404
                if product.available_items < item['quantity']:
                    app.logger.warning(f"Insufficient stock for {item['name']}: {product.available_items} available")
                    return jsonify({"message": f"Insufficient stock for {item['name']}"}), 400

                order_item = OrderItem(
                    order_id=order_id,
                    quantity=item['quantity'],
                    product_id=item['id'],
                    user_id=user.user_id,
                    status="Processing",
                    unit_price=float(item['price']),
                    total_price=float(item['price']) * item['quantity'],
                    vat_per_unit=float(item['price']) * 0.14
                )
                product.available_items -= item['quantity']
                db.session.add(order_item)

            if "address_id" in address_data:
                address_id = address_data.get("address_id")
                address = Address.query.filter_by(user_id=user.user_id, address_id=address_id).first()
                if not address:
                    app.logger.error(f"Address ID {address_id} not found for user {user.user_id}")
                    return jsonify({"message": "Invalid address_id"}), 400
                app.logger.info(f"Using existing address_id: {address_id}")
            elif "address" in address_data and isinstance(address_data['address'], str):
                address_parts = address_data['address'].split(', ')
                address = Address(
                    user_id=user.user_id,
                    full_address=address_data['address'],
                    city=address_parts[1] if len(address_parts) > 1 else "Unknown",
                    postal_code=address_parts[-2].split()[-1] if len(address_parts) > 2 else "N/A",
                    country=address_parts[-1] if len(address_parts) > 0 else "Unknown"
                )
                db.session.add(address)
                app.logger.info("Creating new address")
            else:
                app.logger.error(f"Invalid address format: {address_data}")
                return jsonify({"message": "Address must include address_id or a valid address string"}), 400

            payment = Payment(
                user_id=user.user_id,
                order_id=order_id,
                amount=total,
                payment_method=payment_method,
                status="Pending"
            )
            db.session.add(payment)

            if payment_method == "card" and card_details:
                if not all(k in card_details for k in ['last4', 'expiry', 'type']):
                    app.logger.error(f"Invalid card details: {card_details}")
                    return jsonify({"message": "Invalid card details"}), 400
                saved_card = SavedCreditCard(
                    user_id=user.user_id,
                    card_number=f"****-****-****-{card_details['last4']}",
                    expiry_date=card_details['expiry'],
                    card_type=card_details['type']
                )
                db.session.add(saved_card)
            elif payment_method == "cod":
                app.logger.debug("COD payment selected; skipping credit card save")

            Cart.query.filter_by(user_id=user.user_id).delete()

        db.session.commit()
        app.logger.info(f"Checkout successful for order_id: {order_id}")

        return jsonify({
            "message": "Checkout successful",
            "order_id": order_id,
            "user_id": user.user_id,
            "payment_method": payment_method,
            "total": float(total),
            "item_count": len(items),
            "items": items
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Checkout exception: {str(e)}", exc_info=True)
        return jsonify({"message": f"Checkout failed: {str(e)}"}), 500

@app.route("/admin/dashboard", methods=["GET"])
@admin_required
def admin_dashboard():
    stats = {
        "total_users": User.query.count(),
        "total_orders": OrderItem.query.distinct(OrderItem.order_id).count(),
        "total_products": Product.query.count(),
        "total_revenue": float(db.session.query(db.func.sum(Payment.amount)).scalar() or 0)
    }
    return jsonify(stats)

@app.route("/admin/users", methods=["GET"])
@admin_required
def admin_get_users():
    users = User.query.all()
    return jsonify([{
        "user_id": u.user_id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "created_at": u.created_at.isoformat()
    } for u in users])

@app.route("/admin/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def admin_update_user_role(user_id):
    data = request.get_json()
    new_role = data.get("role")
    if new_role not in ["customer", "admin"]:
        return jsonify({"message": "Invalid role"}), 400
    
    user = User.query.get_or_404(user_id)
    user.role = new_role
    db.session.commit()
    app.logger.info(f"User {user.email} role updated to {new_role}")
    return jsonify({"message": f"User role updated to {new_role}"})

@app.route("/admin/products", methods=["GET"])
@admin_required
def admin_get_products():
    try:
        products = Product.query.all()
        result = []
        for p in products:
            # Fetch image URLs directly from the product_images table
            image_urls = [img.image_url for img in p.images.all() if img.image_url]
            product_data = {
                "product_id": p.product_id,
                "name": p.name,
                "price": float(p.price),
                "description": p.description,
                "available_items": p.available_items,
                "category_id": p.category_id,
                "category_name": p.category.name if p.category else "Uncategorized",
                "images": image_urls,  # Return the raw image URLs as a list
                "created_at": p.created_at.isoformat()
            }
            result.append(product_data)
        return jsonify(result)
    except Exception as e:
        app.logger.error(f"Error fetching admin products: {str(e)}")
        return jsonify({"message": f"Failed to fetch products: {str(e)}"}), 500

@app.route("/admin/products", methods=["POST"])
@admin_required
def admin_add_product():
    # Expect JSON data with image URLs
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400

    # Validate required fields
    required_fields = ["name", "price", "description", "available_items", "category_id", "images"]
    if not all(field in data for field in required_fields):
        return jsonify({"message": "Missing required fields"}), 400

    # Validate images (expecting a list of image URLs)
    if not isinstance(data["images"], list) or not data["images"]:
        return jsonify({"message": "Images must be a non-empty list of URLs"}), 400

    # Validate product name
    if not isinstance(data["name"], str) or not data["name"].strip():
        return jsonify({"message": "Invalid product name"}), 400

    # Validate price
    try:
        price = float(data["price"])
        if price <= 0:
            return jsonify({"message": "Price must be a positive number"}), 400
    except ValueError:
        return jsonify({"message": "Invalid price format"}), 400

    # Validate description
    if not isinstance(data["description"], str):
        return jsonify({"message": "Invalid description"}), 400

    # Validate available items
    try:
        available_items = int(data["available_items"])
        if available_items < 0:
            return jsonify({"message": "Available items must be a non-negative integer"}), 400
    except ValueError:
        return jsonify({"message": "Invalid available items format"}), 400

    # Validate category
    category_id = int(data["category_id"])
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found"}), 404

    try:
        # Create the product
        product = Product(
            name=data["name"],
            price=price,
            description=data["description"],
            available_items=available_items,
            category_id=category_id
        )
        db.session.add(product)
        db.session.flush()  # Ensure product_id is available

        # Add image URLs to ProductImage
        image_urls = data["images"][:5]  # Limit to 5 images
        for image_url in image_urls:
            if isinstance(image_url, str) and image_url.strip():
                product_image = ProductImage(product_id=product.product_id, image_url=image_url)
                db.session.add(product_image)
                app.logger.debug(f"Added image URL for product {product.product_id}: {image_url}")
            else:
                app.logger.warning(f"Invalid image URL skipped: {image_url}")

        db.session.commit()
        app.logger.info(f"Product added: {product.name}, ID: {product.product_id}")
        return jsonify({"message": "Product added", "product_id": product.product_id}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to add product: {str(e)}")
        return jsonify({"message": f"Failed to add product: {str(e)}"}), 500

@app.route("/admin/products/<int:product_id>", methods=["PUT"])
@admin_required
def admin_update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.get_json()
    if not data:
        return jsonify({"message": "No data provided"}), 400
    
    try:
        if "name" in data and data["name"].strip():
            product.name = data["name"]
        if "price" in data:
            try:
                price = float(data["price"])
                if price > 0:
                    product.price = price
            except ValueError:
                return jsonify({"message": "Invalid price format"}), 400
        if "description" in data:
            product.description = data["description"]
        if "available_items" in data:
            try:
                available_items = int(data["available_items"])
                if available_items >= 0:
                    product.available_items = available_items
            except ValueError:
                return jsonify({"message": "Invalid available items format"}), 400
        if "category_id" in data:
            category_id = int(data["category_id"])
            category = Category.query.get(category_id)
            if not category:
                return jsonify({"message": "Category not found"}), 404
            product.category_id = category_id
        
        # Update images if provided
        if "images" in data:
            if not isinstance(data["images"], list):
                return jsonify({"message": "Images must be a list of URLs"}), 400
            # Delete existing images
            ProductImage.query.filter_by(product_id=product_id).delete()
            # Add new image URLs
            for image_url in data["images"][:5]:
                if isinstance(image_url, str) and image_url.strip():
                    product_image = ProductImage(product_id=product.product_id, image_url=image_url)
                    db.session.add(product_image)
                    app.logger.debug(f"Updated image URL for product {product_id}: {image_url}")
        
        db.session.commit()
        app.logger.info(f"Product updated: {product.name}, ID: {product_id}")
        return jsonify({"message": "Product updated"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to update product {product_id}: {str(e)}")
        return jsonify({"message": f"Failed to update product: {str(e)}"}), 500

@app.route("/admin/products/<int:product_id>", methods=["DELETE"])
@admin_required
def admin_delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    try:
        db.session.delete(product)
        db.session.commit()
        app.logger.info(f"Product deleted: {product.name}, ID: {product_id}")
        return jsonify({"message": "Product deleted"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to delete product {product_id}: {str(e)}")
        return jsonify({"message": f"Failed to delete product: {str(e)}"}), 500

@app.route("/admin/categories", methods=["GET"])
@admin_required
def admin_get_categories():
    categories = Category.query.all()
    return jsonify([{
        "category_id": cat.category_id,
        "name": cat.name,
        "created_at": cat.created_at.isoformat(),
        "product_count": Product.query.filter_by(category_id=cat.category_id).count()
    } for cat in categories])

@app.route("/admin/categories", methods=["POST"])
@admin_required
def admin_add_category():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"message": "Missing category name"}), 400
    
    name = data["name"]
    if not isinstance(name, str) or not name.strip():
        return jsonify({"message": "Invalid category name"}), 400
    
    existing = Category.query.filter_by(name=name).first()
    if existing:
        return jsonify({"message": "Category already exists"}), 409
    
    try:
        category = Category(name=name)
        db.session.add(category)
        db.session.commit()
        app.logger.info(f"Category added: {category.name}, ID: {category.category_id}")
        return jsonify({"message": "Category added", "category_id": category.category_id}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to add category: {str(e)}")
        return jsonify({"message": f"Failed to add category: {str(e)}"}), 500

@app.route("/admin/categories/<int:category_id>", methods=["PUT"])
@admin_required
def admin_update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"message": "Missing category name"}), 400
    
    name = data["name"]
    if not isinstance(name, str) or not name.strip():
        return jsonify({"message": "Invalid category name"}), 400
    
    existing = Category.query.filter_by(name=name).filter(Category.category_id != category_id).first()
    if existing:
        return jsonify({"message": "Category name already exists"}), 409
    
    try:
        category.name = name
        db.session.commit()
        app.logger.info(f"Category updated: {category.name}, ID: {category_id}")
        return jsonify({"message": "Category updated"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to update category {category_id}: {str(e)}")
        return jsonify({"message": f"Failed to update category: {str(e)}"}), 500

@app.route("/admin/categories/<int:category_id>", methods=["DELETE"])
@admin_required
def admin_delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    try:
        db.session.delete(category)
        db.session.commit()
        app.logger.info(f"Category deleted: {category.name}, ID: {category_id}")
        return jsonify({"message": "Category and associated products deleted"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Failed to delete category {category_id}: {str(e)}")
        return jsonify({"message": f"Failed to delete category: {str(e)}"}), 500

@app.route("/admin/orders", methods=["GET"])
@admin_required
def admin_get_orders():
    orders = db.session.query(OrderItem).all()
    order_dict = {}
    for order in orders:
        if order.order_id not in order_dict:
            order_dict[order.order_id] = {
                "order_id": order.order_id,
                "user_id": order.user_id,
                "total_price": 0,
                "status": order.status,
                "created_at": order.created_at.isoformat(),
                "items": []
            }
        order_dict[order.order_id]["items"].append({
            "product_id": order.product_id,
            "quantity": order.quantity,
            "total_price": float(order.total_price)
        })
        order_dict[order.order_id]["total_price"] += float(order.total_price)
    
    return jsonify(list(order_dict.values()))

@app.route("/adminlogin", methods=["GET"])
@admin_required
def admin_dashboard_page():
    return jsonify({"message": "Welcome to Admin Dashboard"})

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the E-commerce API"})

@app.route("/health")
def health():
    return jsonify({"status": "ok"}), 200

def ensure_schema_and_seed():
    db.create_all()

    max_product_id = db.session.query(db.func.max(Product.product_id)).scalar()
    if db.engine.dialect.name == "postgresql" and max_product_id is not None:
        db.session.execute(
            text("SELECT setval('products_product_id_seq', :next_id)"),
            {"next_id": max_product_id + 1},
        )
        db.session.commit()

    if not User.query.filter_by(role="admin").first():
        admin_user = User(
            auth0_id="admin|initial",
            name="Admin User",
            email="admin@example.com",
            role="admin",
        )
        db.session.add(admin_user)
        db.session.commit()
        app.logger.info("Initial admin user created: admin@example.com")

    if not Product.query.first():
        from seed_from_json import main as seed_catalog

        seed_catalog()
        app.logger.info("Catalog seeded from products.json")

with app.app_context():
    ensure_schema_and_seed()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    debug = os.getenv("FLASK_DEBUG", "false" if IS_PRODUCTION else "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)