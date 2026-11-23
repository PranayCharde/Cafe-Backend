module.exports = {
  categories: [
    { id: 1, name: "Coffee", slug: "coffee", description: "Freshly brewed coffee varieties", imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop" },
    { id: 2, name: "Tea", slug: "tea", description: "Premium artisanal tea selection", imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=400&auto=format&fit=crop" },
    { id: 3, name: "Pastries", slug: "pastries", description: "Freshly baked pastries and desserts", imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400&auto=format&fit=crop" },
    { id: 4, name: "Sandwiches", slug: "sandwiches", description: "Gourmet grilled sandwiches and wraps", imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=400&auto=format&fit=crop" },
    { id: 5, name: "Salads", slug: "salads", description: "Fresh, crisp and healthy bowls", imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop" }
  ],
  products: [
    { id: 1, categoryId: 1, name: "Filter Coffee", description: "Traditional South Indian filter coffee with frothy milk", price: "25", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: true, available: true },
    { id: 2, categoryId: 2, name: "Masala Chai", description: "Aromatic spiced tea with fresh ginger, cardamom and steamed milk", price: "20", imageUrl: "https://images.unsplash.com/photo-1519817914152-22d216bb9170?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: true, available: true },
    { id: 3, categoryId: 1, name: "Cappuccino", description: "Double espresso topped with rich velvety steamed milk foam", price: "45", imageUrl: "https://images.unsplash.com/photo-1516169460470-0f4bf40b4f5c?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: true, available: true },
    { id: 4, categoryId: 3, name: "Fresh Butter Croissant", description: "Flaky, buttery French pastry baked golden fresh every morning", price: "40", imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: true, available: true },
    { id: 5, categoryId: 4, name: "Paneer Tikka Sandwich", description: "Marinated spiced cottage cheese grilled with bell peppers and mint chutney", price: "60", imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: true, isPopular: true, available: true },
    { id: 6, categoryId: 1, name: "Cold Brew On Tap", description: "Slow-steeped for 18 hours, smooth with subtle chocolate notes", price: "55", imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: false, available: true },
    { id: 7, categoryId: 3, name: "Chocolate Hazelnut Muffin", description: "Rich Belgian chocolate muffin with molten hazelnut core", price: "45", imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: false, available: true },
    { id: 8, categoryId: 5, name: "Mediterranean Quinoa Bowl", description: "Organic greens, cherry tomatoes, cucumbers, kalamata olives and feta", price: "75", imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400&auto=format&fit=crop", isVeg: true, isSpicy: false, isPopular: false, available: true }
  ],
  reviews: [
    { name: "Sarah Johnson", rating: 5, message: "The best coffee in town! Cappuccino is absolutely perfect every time.", city: "New York", approved: true },
    { name: "Michael Chen", rating: 4, message: "Great selection of pastries and sandwiches. The filter coffee is outstanding.", city: "Boston", approved: true },
    { name: "Emma Rodriguez", rating: 5, message: "I'm obsessed with their masala chai! Croissants are always fresh and buttery.", city: "Chicago", approved: true }
  ]
};

