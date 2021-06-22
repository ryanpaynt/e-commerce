const router = require('express').Router();
const { Tag, Product, ProductTag, Category } = require('../../models');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  Product.findAll({
    attributes: ['id', 'product_name', 'price', 'stock'],
    include: [
      {
        model: Category,
        attributes:['category_name']
      },
      {
        model: Tag,
        attributes: ['tag_name']
      }
    ]
  })
  .then(data => res.json(data))
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  })
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Product.findOne({
    where: {
      id: req.params.id
    },
    attributes: ['id', 'product_name', 'price', 'stock'],
    include: [
      {
        model: Category,
        attributes:['category_name']
      },
      {
        model: Tag,
        attributes: ['tag_name']
      }
    ]
  })
  .then(data => {
    if(!data){
      res.status(404).json({message: 'No product found'});
      return
    }
    res.json(data);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
});

router.post('/', (req, res) => {
  // create a new tag
  Product.create({    
    product_name: req.body.product_name,
    price: req.body.price,
    stock: req.body.stock,
    category_id: req.body.category_id,
    tagIds: req.body.tagIds
  })
  .then((product) => {
    if(req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });
      return ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(200).json(product);
  })
  .then((productTagIds) => res.status(200).json(productTagIds))
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  })
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
  .then((product) => {
    return ProductTag.findAll({ where: { product_id: req.params.id} });
  })
  .then((productTags) => {
    const productTagIds = productTags.map(({tag_id}) => tag_id);
    const newProductTags = req.body.tagIds
    .filter((tag_id) => !productTagIds.includes(tag_id))
    .map((tag_id)=>{
      return{
        product_id: req.params.id,
        tag_id,
      };
    });
    const productTagsToRemove = productTags
    .filter(({tag_id}) => !req.bpdy.tagIds.includes(tag_id))
    .map(({id}) => id);

    return Promise.all([
      ProductTag.destroy({ where: { id: productTagsToRemove } }),
      ProductTag.bulkCreate(newProductTags),
    ]);
  })
  .then((updatedProductTags) => res.json(updatedProductTags))
  .catch((err) => {
    console.log(err);
    res.status(400).json(err);
  });
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
});

module.exports = router;
