import { PrismaClient, ProductStatus, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar tipos padrão
  const defaultTypes = [
    { name: 'ITEMS', emoji: '📦', description: 'Itens do jogo' },
    { name: 'SKINS', emoji: '🎮', description: 'Skins e aparências' },
    { name: 'CONTAS', emoji: '👤', description: 'Contas de serviços' },
    { name: 'DIGITAL', emoji: '💾', description: 'Produtos digitais' },
    { name: 'PHYSICAL', emoji: '📦', description: 'Produtos físicos' },
  ];

  for (const type of defaultTypes) {
    await prisma.productTypeConfig.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    });
    console.log(`✅ Tipo "${type.name}" criado`);
  }

  // Limpar dados existentes (opcional)
  // await prisma.order.deleteMany({});
  // await prisma.product.deleteMany({});

  // Produtos de exemplo
  const products = [
    {
      name: 'Curso Python Completo',
      description:
        'Aprenda Python do zero ao avançado com 50+ aulas práticas',
      price: 199.9,
      quantity: 999,
      category: 'Cursos',
      type: 'DIGITAL',
      imageUrl:
        'https://via.placeholder.com/300x200?text=Python+Course',
    },
    {
      name: 'Mousepad RGB 40x30cm',
      description: 'Mousepad com iluminação RGB e base antiderrapante',
      price: 89.9,
      quantity: 20,
      category: 'Periféricos',
      type: 'PHYSICAL',
      imageUrl:
        'https://via.placeholder.com/300x200?text=Mousepad+RGB',
    },
    {
      name: 'Ebook: Desenvolvimento Web',
      description: 'Guia completo de desenvolvimento web moderno',
      price: 49.9,
      quantity: 500,
      category: 'Ebooks',
      type: 'DIGITAL',
      imageUrl:
        'https://via.placeholder.com/300x200?text=Web+Development',
    },
    {
      name: 'Teclado Mecânico RGB',
      description: 'Teclado mecânico com switches customizáveis',
      price: 349.9,
      quantity: 10,
      category: 'Periféricos',
      type: 'PHYSICAL',
      imageUrl:
        'https://via.placeholder.com/300x200?text=Keyboard',
    },
    {
      name: 'Template de Website',
      description: 'Template HTML/CSS/JS pronto para uso',
      price: 29.9,
      quantity: 1000,
      category: 'Digitais',
      type: 'DIGITAL',
      imageUrl:
        'https://via.placeholder.com/300x200?text=Website+Template',
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (!existing) {
      const created = await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: new Prisma.Decimal(product.price),
          quantity: product.quantity,
          category: product.category,
          type: product.type,
          imageUrl: product.imageUrl,
          status: ProductStatus.ACTIVE,
        },
      });
      console.log(`✅ Produto criado: ${created.name} (${created.id})`);
    } else {
      console.log(`⚠️ Produto já existe: ${existing.name}`);
    }
  }

  console.log('🎉 Seed concluído!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
