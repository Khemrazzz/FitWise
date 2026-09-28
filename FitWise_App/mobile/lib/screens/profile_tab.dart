import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';
import 'achievements_screen.dart';
import 'messages_screen.dart';
import 'notifications_screen.dart';
import 'settings_screen.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  bool _loading = true;
  String _fullName = '';
  String _memberSince = '';
  Map<String, dynamic>? _assessment;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = supabase.auth.currentUser!.id;
    final profile = await supabase.from('profiles').select('full_name, created_at').eq('id', userId).maybeSingle();
    final assessment = await supabase
        .from('assessments')
        .select('age, gender, height_m, weight_kg, bmi, goal, target_weight_kg, experience_level, restrictions')
        .eq('member_id', userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    setState(() {
      _fullName = (profile?['full_name'] as String?) ?? supabase.auth.currentUser?.email ?? 'Member';
      final createdAt = profile?['created_at'] as String?;
      _memberSince = createdAt != null ? 'Member since ${DateTime.parse(createdAt).toLocal().let((d) => "${d.month}/${d.year}")}' : '';
      _assessment = assessment;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final a = _assessment;
    final restrictions = (a?['restrictions'] as List?)?.cast<String>() ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Column(
          children: [
            CircleAvatar(
              radius: 34,
              backgroundColor: FitWiseColors.blue,
              child: Text(_fullName.isNotEmpty ? _fullName[0].toUpperCase() : '?', style: const TextStyle(fontSize: 24, color: Colors.white)),
            ),
            const SizedBox(height: 8),
            Text(_fullName, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
            if (_memberSince.isNotEmpty) Text(_memberSince, style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 14),
        if (a != null)
          MobileCard(
            child: Column(
              children: [
                _row('Age', '${a['age']} years'),
                _row('Gender', '${a['gender']}'),
                _row('Height', '${a['height_m']} m'),
                _row('Weight', '${a['weight_kg']} kg'),
                _row('BMI', '${a['bmi']}'),
                _row('Goal', ('${a['goal']}').replaceAll('_', ' ')),
                if (a['target_weight_kg'] != null) _row('Target weight', '${a['target_weight_kg']} kg'),
                if (restrictions.isNotEmpty) _row('Restrictions', restrictions.join(', ')),
              ],
            ),
          ),
        MobileCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              _navRow(context, Icons.notifications_outlined, 'Notifications', const NotificationsScreen()),
              const Divider(height: 1),
              _navRow(context, Icons.chat_bubble_outline, 'Messages', const MessagesScreen()),
              const Divider(height: 1),
              _navRow(context, Icons.emoji_events_outlined, 'Achievements', const AchievementsScreen()),
              const Divider(height: 1),
              _navRow(context, Icons.settings_outlined, 'Settings', const SettingsScreen()),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            style: OutlinedButton.styleFrom(foregroundColor: FitWiseColors.red, side: const BorderSide(color: FitWiseColors.red)),
            onPressed: () => supabase.auth.signOut(),
            child: const Text('Log out'),
          ),
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
          Flexible(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12))),
        ],
      ),
    );
  }

  Widget _navRow(BuildContext context, IconData icon, String label, Widget screen) {
    return ListTile(
      leading: Icon(icon, color: FitWiseColors.blue),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right, color: FitWiseColors.muted),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen)),
    );
  }
}

extension _Let<T> on T {
  R let<R>(R Function(T) block) => block(this);
}
