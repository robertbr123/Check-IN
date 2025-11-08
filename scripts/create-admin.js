const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Criando usuário administrador...')

  try {
    // Verifica se já existe um admin
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@checkin.com' },
    })

    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe!')
      console.log('📧 Email: admin@checkin.com')
      return
    }

    // Cria senha hash
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Cria o usuário admin
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@checkin.com',
        password: hashedPassword,
        role: 'ADMIN',
        active: true,
      },
    })

    console.log('✅ Usuário administrador criado com sucesso!')
    console.log('\n📝 Credenciais de acesso:')
    console.log('📧 Email: admin@checkin.com')
    console.log('🔒 Senha: admin123')
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n')
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
