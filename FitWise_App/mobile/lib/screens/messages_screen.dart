import 'package:flutter/material.dart';

import '../main.dart';
import '../theme.dart';

// There's no trainer<->member messaging system in the backend (no messages
// table/RLS) -- building a chat UI without one would just be decoration. This
// screen instead surfaces the one real channel that already exists: the
// trainer's notes recorded against the member's assessments.
class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _notes = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final userId = supabase.auth.currentUser!.id;
    final rows = await supabase
        .from('assessments')
        .select('trainer_notes, created_at')
        .eq('member_id', userId)
        .not('trainer_notes', 'is', null)
        .order('created_at', ascending: false);
    setState(() {
      _notes = List<Map<String, dynamic>>.from(rows);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FitWiseColors.background,
      appBar: AppBar(title: const Text('Messages')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notes.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                      'No messages yet -- your trainer\'s notes will appear here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: FitWiseColors.muted),
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: _notes.map((n) {
                    final date = DateTime.parse(n['created_at'] as String).toLocal();
                    return Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: FitWiseColors.blueSoft,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Your trainer · ${date.day}/${date.month}/${date.year}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                          const SizedBox(height: 4),
                          Text(n['trainer_notes'] as String, style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    );
                  }).toList(),
                ),
    );
  }
}
