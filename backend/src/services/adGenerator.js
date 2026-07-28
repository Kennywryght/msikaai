class AdGenerator {
  constructor() {
    this.templates = {
      'Farm Inputs': {
        title: '🌾 Quality {product} Available!',
        description: 'Fresh {product} from trusted suppliers. {quality} quality. {price} per {unit}.',
        hashtags: ['#FarmInputs', '#Agriculture', '#MalawiFarming', '#QualityHarvest']
      },
      'Construction Materials': {
        title: '🔨 {product} - Build with Confidence!',
        description: 'Premium {product} for all your construction needs. {quality} grade. {price} per {unit}.',
        hashtags: ['#Construction', '#Building', '#MalawiHomes', '#QualityMaterials']
      },
      'Plumber': {
        title: '🔧 Professional {service} Services',
        description: 'Experienced {service} in Mitundu. {experience} years of experience. Emergency services available.',
        hashtags: ['#Plumber', '#Repairs', '#MitunduServices', '#Reliable']
      },
      'Electrician': {
        title: '⚡ Expert {service} Services',
        description: 'Licensed {service} with {experience} years experience. Safety guaranteed. Quality work.',
        hashtags: ['#Electrician', '#ElectricalWork', '#SafetyFirst', '#Mitundu']
      },
      'Carpenter': {
        title: '🪚 Custom {service} Services',
        description: 'Skilled {service} for furniture, doors, and custom woodwork. {experience} years experience.',
        hashtags: ['#Carpenter', '#Woodwork', '#CustomFurniture', '#QualityCraft']
      },
      'Mechanic': {
        title: '🔧 {service} - Keep Your Car Running!',
        description: 'Professional {service} with {experience} years experience. All repairs and maintenance.',
        hashtags: ['#Mechanic', '#CarRepair', '#AutoService', '#Reliable']
      },
      'Retail': {
        title: '🛍️ {product} - Best Prices in Mitundu!',
        description: 'Quality {product} at competitive prices. Visit our shop for the best deals.',
        hashtags: ['#Retail', '#Shopping', '#BestPrices', '#Mitundu']
      },
      'Restaurant': {
        title: '🍽️ Delicious {product} - Come Dine With Us!',
        description: 'Fresh {product} prepared daily. Clean environment. Affordable prices.',
        hashtags: ['#Restaurant', '#Food', '#Delicious', '#MitunduEats']
      },
      'Tailor': {
        title: '👔 Professional {service} Services',
        description: 'Expert {service} with {experience} years experience. Custom designs and repairs.',
        hashtags: ['#Tailor', '#Sewing', '#CustomClothes', '#QualityFashion']
      },
      'Hairdresser': {
        title: '💇 {service} - Look Your Best!',
        description: 'Professional {service} services. Haircuts, styling, and beauty treatments.',
        hashtags: ['#Hairdresser', '#Salon', '#Beauty', '#Mitundu']
      },
      'default': {
        title: '📢 {product} Available!',
        description: 'Quality {product} available in Mitundu. {price} per {unit}. Contact us for details.',
        hashtags: ['#Mitundu', '#Available', '#Quality', '#BestPrice']
      }
    };

    this.qualityWords = ['Premium', 'High Quality', 'Top Grade', 'Excellent', 'Superior'];
    this.emojiMap = {
      'Farm Inputs': '🌾',
      'Construction Materials': '🔨',
      'Plumber': '🔧',
      'Electrician': '⚡',
      'Carpenter': '🪚',
      'Mechanic': '🔧',
      'Retail': '🛍️',
      'Restaurant': '🍽️',
      'Tailor': '👔',
      'Hairdresser': '💇',
      'default': '📢'
    };
  }

  async generateAd(imageFile, productInfo) {
    try {
      // Step 1: Analyze image
      const imageAnalysis = await this.analyzeImage(imageFile);
      
      // Step 2: Get category template
      const category = productInfo.category || imageAnalysis.category || 'default';
      const template = this.templates[category] || this.templates.default;
      
      // Step 3: Generate ad copy
      const adCopy = this.generateAdCopy(template, productInfo, imageAnalysis);
      
      // Step 4: Generate social media posts
      const socialPosts = this.generateSocialPosts(adCopy, category);
      
      // Step 5: Generate marketing tagline
      const tagline = this.generateTagline(productInfo, category);
      
      return {
        success: true,
        ad: adCopy,
        socialPosts: socialPosts,
        tagline: tagline,
        imageAnalysis: imageAnalysis,
        suggestedCategory: category
      };
    } catch (error) {
      console.error('Ad generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeImage(imageFile) {
    // In production: Use CLIP, YOLO, or similar model
    // For now, return simulated analysis
    const products = [
      { name: 'maize', category: 'Farm Inputs' },
      { name: 'tomatoes', category: 'Food & Groceries' },
      { name: 'cement', category: 'Construction Materials' },
      { name: 'chickens', category: 'Livestock' },
      { name: 'furniture', category: 'Products' },
      { name: 'clothes', category: 'Retail' }
    ];

    const selected = products[Math.floor(Math.random() * products.length)];

    return {
      detectedProduct: selected.name,
      category: selected.category,
      confidence: 0.85 + (Math.random() * 0.1),
      quality: this.qualityWords[Math.floor(Math.random() * this.qualityWords.length)],
      colors: ['red', 'green', 'blue', 'brown', 'white'][Math.floor(Math.random() * 5)],
      size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)],
      description: `A high-quality ${selected.name} product with excellent appearance.`
    };
  }

  generateAdCopy(template, productInfo, imageAnalysis) {
    const product = productInfo.title || imageAnalysis.detectedProduct || 'Product';
    const price = productInfo.price || 'competitive';
    const unit = productInfo.unit || 'piece';
    const quality = imageAnalysis.quality || 'High Quality';
    const experience = Math.floor(Math.random() * 15) + 3;

    const title = template.title
      .replace(/{product}/g, product)
      .replace(/{service}/g, product);

    const description = template.description
      .replace(/{product}/g, product)
      .replace(/{service}/g, product)
      .replace(/{price}/g, price)
      .replace(/{unit}/g, unit)
      .replace(/{quality}/g, quality)
      .replace(/{experience}/g, experience);

    return {
      title: title,
      description: description,
      callToAction: `📞 Call us now for ${product}!`,
      hashtags: template.hashtags || ['#Mitundu'],
      confidence: 0.9
    };
  }

  generateSocialPosts(ad, category) {
    const emoji = this.emojiMap[category] || this.emojiMap.default;
    
    return {
      facebook: `${emoji} ${ad.title}\n\n${ad.description}\n\n${ad.callToAction}\n\n${ad.hashtags.map(h => `#${h}`).join(' ')}`,
      whatsapp: `${emoji} ${ad.title}\n\n${ad.description}\n\n${ad.callToAction}`,
      twitter: `${emoji} ${ad.title}\n${ad.description.substring(0, 100)}...\n${ad.hashtags.map(h => `#${h}`).join(' ')}`
    };
  }

  generateTagline(productInfo, category) {
    const taglines = {
      'Farm Inputs': 'Growing Malawi, one harvest at a time.',
      'Construction Materials': 'Building the future of Mitundu.',
      'Plumber': 'Trusted plumbing solutions for your home.',
      'Electrician': 'Powering homes and businesses safely.',
      'Carpenter': 'Crafting quality woodwork for generations.',
      'Mechanic': 'Keeping Mitundu on the move.',
      'Retail': 'Quality products at fair prices.',
      'Restaurant': 'Taste the best of Mitundu.',
      'Tailor': 'Dressed for success in Malawi.',
      'Hairdresser': 'Style that speaks for itself.'
    };

    return taglines[category] || 'Quality service you can trust.';
  }

  // Batch generate ads
  async batchGenerateAds(items) {
    const results = [];
    for (const item of items) {
      const result = await this.generateAd(item.imageFile, item.productInfo);
      results.push({
        ...result,
        originalItem: item.productInfo
      });
    }
    return results;
  }
}

export default new AdGenerator();