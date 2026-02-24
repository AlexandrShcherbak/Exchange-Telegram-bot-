const { Markup } = require('telegraf');

const setupAdminHandlers = (bot) => {
  bot.hears('/admin', async (ctx) => {
    return ctx.reply(
      '⚙️ Админ-панель временно в минимальном режиме.',
      Markup.inlineKeyboard([
        [Markup.button.callback('📊 Статистика (скоро)', 'admin_stats_stub')]
      ])
    );
  });

  bot.action('admin_stats_stub', async (ctx) => {
    await ctx.answerCbQuery('Раздел в разработке');
  });
};

module.exports = { setupAdminHandlers };
