const Products = require('../models/ProductModel')

// Filter, sorting and paginating

class APTfeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    filtering() {
        const queryObject = { ...this.queryString } //this.queryString = req.query

        const excludeFields = ['page', 'sort', 'limit']
        excludeFields.forEach(el => delete (queryObject[el]))

        let queryStr = JSON.stringify(queryObject)

        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => {
            return ('$' + match)
        })

        //    gte = greater than or equal
        //    lte = lesser than or equal
        //    lt = lesser than
        //    gt = greater than

        this.query.find(JSON.parse(queryStr))
        return this
    }
    sorting() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            this.query = this.query.sort('-createdAt')
        }
        return this
    }
    paginating() {
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 1
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit)
        return this;
    }

}

const productCtrl = {
    getProducts: async (req, res) => {
        try {

            const features = new APTfeatures(Products.find(), req.query).filtering().sorting().paginating()
            const products = await features.query
            res.json({ products })

        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    },

    createProduct: async (req, res) => {
        try {
            const { product_id, title, price, description, content, images, category } = req.body;
            if (!images) return res.status(400).json({ msg: "No image upload" })

            const product = await Products.findOne({ product_id })
            if (product)
                return res.status(400).json({ msg: "This product already exists." })

            const newProduct = new Products({
                product_id, title: title.toLowerCase(), price, description, content, images, category
            })

            await newProduct.save()
            res.json({ msg: "Created a product" })

        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    },

    deleteProduct: async (req, res) => {
        try {
            await Products.findByIdAndDelete(req.params.id)
            res.json({ msg: "Deleted a Product" })

        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    },

    updateProduct: async (req, res) => {
        try {
            const { title, price, description, content, images, category } = req.body;
            if (!images) return res.status(400).json({ msg: "No image upload" })

            await Products.findOneAndUpdate({ _id: req.params.id }, {
                title: title.toLowerCase(), price, description, content, images, category
            })

            res.json({ msg: "Updated a Product" })
        } catch (error) {
            return res.status(500).json({ msg: error.message })
        }
    },
}

module.exports = productCtrl