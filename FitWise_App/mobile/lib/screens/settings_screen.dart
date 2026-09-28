import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../main.dart';
import '../theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _passwordController = TextEditingController();
  bool _saving = false;
  String? _message;
  String? _error;

  Future<void> _changePassword() async {
    if (_passwordController.text.isEmpty) {
      setState(() => _error = 'Enter a new password first.');
      return;
    }
    setState(() { _saving = true; _error = null; _message = null; });
    try {
      await supabase.auth.updateUser(UserAttributes(password: _passwordController.text));
      _passwordController.clear();
      setState(() => _message = 'Password changed.');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = supabase.auth.currentUser?.email ?? '';
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          MobileCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Account', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(email, style: const TextStyle(color: FitWiseColors.muted, fontSize: 12)),
              ],
            ),
          ),
          MobileCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Change password', style: TextStyle(fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'New password'),
                ),
                if (_error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_error!, style: const TextStyle(color: FitWiseColors.red))),
                if (_message != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(_message!, style: const TextStyle(color: FitWiseColors.green))),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _saving ? null : _changePassword,
                    child: Text(_saving ? 'Saving...' : 'Change Password'),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: FitWiseColors.red, side: const BorderSide(color: FitWiseColors.red)),
              onPressed: () => supabase.auth.signOut(),
              child: const Text('Log out'),
            ),
          ),
        ],
      ),
    );
  }
}
