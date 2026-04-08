import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function AdminDashboard() {
  const { getAccessTokenSilently } = useAuth0();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    available_items: "",
    category_id: "",
    images: [], // Array of image URLs (strings)
  });
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchAdminData = async () => {
    try {
      const token = await getAccessTokenSilently();
      const [statsRes, usersRes, ordersRes, productsRes, categoriesRes] = await Promise.all([
        fetch("http://localhost:8080/admin/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/admin/products", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:8080/admin/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok) throw new Error((await statsRes.json()).message || "Failed to fetch stats");
      if (!usersRes.ok) throw new Error((await usersRes.json()).message || "Failed to fetch users");
      if (!ordersRes.ok) throw new Error((await ordersRes.json()).message || "Failed to fetch orders");
      if (!productsRes.ok) throw new Error((await productsRes.json()).message || "Failed to fetch products");
      if (!categoriesRes.ok) throw new Error((await categoriesRes.json()).message || "Failed to fetch categories");

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setStats(statsData);
      setUsers(usersData);
      setOrders(ordersData);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (response.ok) {
        setUsers(users.map(u => (u.user_id === userId ? { ...u, role: newRole } : u)));
      } else {
        throw new Error((await response.json()).message || "Failed to update role");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        available_items: parseInt(newProduct.available_items),
        category_id: parseInt(newProduct.category_id),
        images: newProduct.images, // Array of image URLs
      };

      const response = await fetch("http://localhost:8080/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error((await response.json()).message || "Failed to add product");
      await fetchAdminData(); // Refresh product list
      setNewProduct({ name: "", price: "", description: "", available_items: "", category_id: "", images: [] });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const productData = {
        name: editingProduct.name,
        price: parseFloat(editingProduct.price),
        description: editingProduct.description,
        available_items: parseInt(editingProduct.available_items),
        category_id: parseInt(editingProduct.category_id),
        images: editingProduct.newImages.length > 0 ? editingProduct.newImages : editingProduct.images,
      };

      const response = await fetch(`http://localhost:8080/admin/products/${editingProduct.product_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error((await response.json()).message || "Failed to update product");
      await fetchAdminData(); // Refresh product list
      setEditingProduct(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/admin/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to delete product");
      setProducts(products.filter(p => p.product_id !== productId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch("http://localhost:8080/admin/categories", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCategory),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to add category");
      const data = await response.json();
      setCategories([...categories, { ...newCategory, category_id: data.category_id, product_count: 0 }]);
      setNewCategory({ name: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/admin/categories/${editingCategory.category_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editingCategory.name }),
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to update category");
      setCategories(categories.map(c => (c.category_id === editingCategory.category_id ? editingCategory : c)));
      setEditingCategory(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`http://localhost:8080/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error((await response.json()).message || "Failed to delete category");
      setCategories(categories.filter(c => c.category_id !== categoryId));
      setProducts(products.filter(p => p.category_id !== categoryId));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!error) fetchAdminData();
  }, [getAccessTokenSilently, error]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.href = "/"}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <section className="py-5 px-4 md:px-16">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <p className="text-lg">Total Users: {stats.total_users}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <p className="text-lg">Total Orders: {stats.total_orders}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <p className="text-lg">Total Products: {stats.total_products}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <p className="text-lg">Total Revenue: ${stats.total_revenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Manage Products Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Products</h2>
        {/* Add Product Form */}
        <form onSubmit={handleAddProduct} className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Add New Product</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Available Items</label>
              <input
                type="number"
                value={newProduct.available_items}
                onChange={(e) => setNewProduct({ ...newProduct, available_items: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URLs (comma-separated)</label>
              <input
                type="text"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                value={newProduct.images.join(", ")}
                onChange={(e) => {
                  const urls = e.target.value.split(",").map(url => url.trim()).filter(url => url);
                  setNewProduct({ ...newProduct, images: urls });
                }}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {newProduct.images.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {newProduct.images.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Preview ${index}`}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => (e.target.src = "https://placehold.co/300x300")}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add Product
          </button>
        </form>

        {/* Edit Product Form */}
        {editingProduct && (
          <form onSubmit={handleUpdateProduct} className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Edit Product</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Available Items</label>
                <input
                  type="number"
                  value={editingProduct.available_items}
                  onChange={(e) => setEditingProduct({ ...editingProduct, available_items: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Images</label>
                <div className="flex gap-2 mb-2">
                  {editingProduct.images && editingProduct.images.length > 0 ? (
                    editingProduct.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt="Product"
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => (e.target.src = "https://placehold.co/300x300")}
                      />
                    ))
                  ) : (
                    <p>No images available</p>
                  )}
                </div>
                <label className="block text-sm font-medium mb-1">New Image URLs (comma-separated, optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                  value={editingProduct.newImages.join(", ")}
                  onChange={(e) => {
                    const urls = e.target.value.split(",").map(url => url.trim()).filter(url => url);
                    setEditingProduct({ ...editingProduct, newImages: urls });
                  }}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {editingProduct.newImages && editingProduct.newImages.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {editingProduct.newImages.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Preview ${index}`}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => (e.target.src = "https://placehold.co/300x300")}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Update Product
              </button>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Price</th>
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-left">Stock</th>
                <th className="py-2 px-4 border-b text-left">Images</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.product_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{product.product_id}</td>
                  <td className="py-2 px-4 border-b">{product.name}</td>
                  <td className="py-2 px-4 border-b">${product.price.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">{product.category_name}</td>
                  <td className="py-2 px-4 border-b">{product.available_items}</td>
                  <td className="py-2 px-4 border-b">
                    <div className="flex gap-2">
                      {product.images && product.images.length > 0 ? (
                        product.images.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt="Product"
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => (e.target.src = "https://placehold.co/300x300")}
                          />
                        ))
                      ) : (
                        <p>No images</p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => setEditingProduct({ ...product, newImages: [] })}
                      className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.product_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Categories Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Categories</h2>
        {/* Add Category Form */}
        <form onSubmit={handleAddCategory} className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-2">Add New Category</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category Name</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Add Category
          </button>
        </form>

        {/* Edit Category Form */}
        {editingCategory && (
          <form onSubmit={handleUpdateCategory} className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Edit Category</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Update Category
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Categories Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Product Count</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.category_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{category.category_id}</td>
                  <td className="py-2 px-4 border-b">{category.name}</td>
                  <td className="py-2 px-4 border-b">{category.product_count}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => setEditingCategory(category)}
                      className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.category_id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Role</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{user.user_id}</td>
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.role}</td>
                  <td className="py-2 px-4 border-b">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                      className="border rounded p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-2 px-4 border-b text-left">Order ID</th>
                <th className="py-2 px-4 border-b text-left">User ID</th>
                <th className="py-2 px-4 border-b text-left">Total</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(order => (
                <tr key={order.order_id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{order.order_id}</td>
                  <td className="py-2 px-4 border-b">{order.user_id}</td>
                  <td className="py-2 px-4 border-b">${order.total_price.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}